package com.example.helloworld.controller;

import com.example.helloworld.dto.GreetingRequest;
import com.example.helloworld.dto.GreetingResponse;
import com.example.helloworld.service.GreetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class GreetingController {

    /** Default number of greetings returned per page when {@code size} is not supplied. */
    static final int DEFAULT_PAGE_SIZE = 20;

    private final GreetingService greetingService;

    /** Creates a greeting from the submitted name and returns the persisted representation. */
    @PostMapping(path = "/greeting", consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GreetingResponse createGreeting(@Valid @RequestBody GreetingRequest request) {
        return greetingService.createGreeting(request);
    }

    /** Returns stored greetings ordered by date descending, paginated with {@code page}/{@code size}. */
    @GetMapping(path = "/greetings", produces = MediaType.APPLICATION_JSON_VALUE)
    public Page<GreetingResponse> getGreetings(@PageableDefault(size = DEFAULT_PAGE_SIZE) Pageable pageable) {
        return greetingService.getGreetings(pageable);
    }
}
