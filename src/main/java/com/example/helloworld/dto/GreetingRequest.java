package com.example.helloworld.dto;

import jakarta.validation.constraints.NotBlank;

public record GreetingRequest(@NotBlank String name) {
}
