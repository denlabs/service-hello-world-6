package com.example.helloworld.service;

import com.example.helloworld.dto.GreetingRequest;
import com.example.helloworld.dto.GreetingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GreetingService {

    GreetingResponse createGreeting(GreetingRequest request);

    Page<GreetingResponse> getGreetings(Pageable pageable);
}
