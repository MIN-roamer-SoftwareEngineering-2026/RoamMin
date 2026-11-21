package com.minroamer.ai;

import com.minroamer.api.ApiResponse;
import com.minroamer.common.ApiException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.lang.reflect.Type;
import org.springframework.core.MethodParameter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

@RestControllerAdvice(assignableTypes = AiController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
class AiRequestBodyAdvice extends RequestBodyAdviceAdapter {
    private static final int MAX_BODY_BYTES = 96 * 1024;

    @Override
    public boolean supports(MethodParameter parameter, Type type, Class<? extends HttpMessageConverter<?>> converter) {
        return true;
    }

    @Override
    public HttpInputMessage beforeBodyRead(
        HttpInputMessage input,
        MethodParameter parameter,
        Type type,
        Class<? extends HttpMessageConverter<?>> converter
    ) throws IOException {
        if (input.getHeaders().getContentLength() > MAX_BODY_BYTES) throw bodyTooLarge();
        byte[] bytes = input.getBody().readNBytes(MAX_BODY_BYTES + 1);
        if (bytes.length > MAX_BODY_BYTES) throw bodyTooLarge();
        return new HttpInputMessage() {
            @Override
            public ByteArrayInputStream getBody() {
                return new ByteArrayInputStream(bytes);
            }

            @Override
            public HttpHeaders getHeaders() {
                return input.getHeaders();
            }
        };
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse<Void>> invalidJson() {
        return ResponseEntity.badRequest().body(ApiResponse.failure(400, "Invalid AI request JSON"));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiResponse<Void>> unsupportedMediaType() {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
            .body(ApiResponse.failure(415, "Send the AI request as application/json."));
    }

    private static ApiException bodyTooLarge() {
        return new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "AI request must be 96 KiB or smaller.");
    }
}
