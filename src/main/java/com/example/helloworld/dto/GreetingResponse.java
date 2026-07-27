package com.example.helloworld.dto;

import com.example.helloworld.entity.Greeting;
import java.time.Instant;
import java.util.UUID;

public record GreetingResponse(UUID id, String name, Instant date, String response) {

    public static GreetingResponse from(Greeting greeting) {
        return new GreetingResponse(
                greeting.getId(),
                greeting.getName(),
                greeting.getDate(),
                greeting.getResponse());
    }
}
