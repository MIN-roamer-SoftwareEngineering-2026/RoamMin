package com.minroamer.user;

import com.minroamer.common.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AvatarStorageService {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final long MAX_PIXELS = 20_000_000L;
    private final Path avatarDirectory;

    public AvatarStorageService(@Value("${app.avatar.directory:./data/avatars}") String directory) {
        this.avatarDirectory = Paths.get(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw invalid("Choose an image to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Avatar image must be 5 MB or smaller");
        }

        String format = detectFormat(file);
        String extension = switch (format) {
            case "png" -> ".png";
            case "jpeg" -> ".jpg";
            default -> throw invalid("Only PNG and JPEG images are supported");
        };

        Files.createDirectories(avatarDirectory);
        String filename = UUID.randomUUID() + extension;
        Path destination = avatarDirectory.resolve(filename).normalize();
        if (!destination.getParent().equals(avatarDirectory)) {
            throw invalid("Invalid image filename");
        }
        file.transferTo(destination);
        return "/api/v1/users/avatars/" + filename;
    }

    public StoredAvatar load(String filename) throws IOException {
        if (filename == null || !filename.matches("[a-f0-9-]{36}\\.(png|jpg)")) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Avatar not found");
        }
        Path path = avatarDirectory.resolve(filename).normalize();
        if (!path.getParent().equals(avatarDirectory) || !Files.isRegularFile(path)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Avatar not found");
        }
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Avatar not found");
        }
        MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return new StoredAvatar(resource, mediaType);
    }

    private String detectFormat(MultipartFile file) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(file.getInputStream())) {
            if (input == null) throw invalid("The uploaded file is not a valid image");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid("The uploaded file is not a valid image");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) {
                    throw invalid("Image dimensions must be 20 megapixels or smaller");
                }
                if (!format.equals("png") && !format.equals("jpeg") && !format.equals("jpg")) {
                    throw invalid("Only PNG and JPEG images are supported");
                }
                return format.equals("jpg") ? "jpeg" : format;
            } finally {
                reader.dispose();
            }
        }
    }

    private ApiException invalid(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public record StoredAvatar(Resource resource, MediaType mediaType) {}
}
