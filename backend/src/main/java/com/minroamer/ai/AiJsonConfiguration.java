package com.minroamer.ai;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import com.minroamer.ai.dto.ChatRequest;
import com.minroamer.ai.dto.ItineraryRequest;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
class AiJsonConfiguration implements WebMvcConfigurer {
    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (var converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter jsonConverter) {
                ObjectMapper strict = jsonConverter.getObjectMapper().copy()
                    .enable(JsonParser.Feature.STRICT_DUPLICATE_DETECTION)
                    .enable(DeserializationFeature.FAIL_ON_TRAILING_TOKENS)
                    .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT);
                for (LogicalType numeric : List.of(LogicalType.Integer, LogicalType.Float)) {
                    strict.coercionConfigFor(numeric)
                        .setCoercion(CoercionInputShape.String, CoercionAction.Fail)
                        .setCoercion(CoercionInputShape.EmptyString, CoercionAction.Fail);
                }
                strict.coercionConfigFor(LogicalType.Textual)
                    .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                    .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail);
                jsonConverter.registerObjectMappersForType(ItineraryRequest.class,
                    mappers -> mappers.put(MediaType.APPLICATION_JSON, strict));
                jsonConverter.registerObjectMappersForType(ChatRequest.class,
                    mappers -> mappers.put(MediaType.APPLICATION_JSON, strict));
            }
        }
    }
}
