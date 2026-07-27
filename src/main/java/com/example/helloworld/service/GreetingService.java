package com.example.helloworld.service;

import com.example.helloworld.dto.GreetingRequest;
import com.example.helloworld.dto.GreetingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Business operations for creating and retrieving greetings. */
public interface GreetingService {

    /**
     * Creates and persists a greeting for the submitted name.
     *
     * @param request the submitted name
     * @return the persisted greeting including its generated id, timestamp and response text
     */
    GreetingResponse createGreeting(GreetingRequest request);

    /**
     * Retrieves stored greetings, always ordered by {@code date} descending (newest first).
     *
     * @param pageable page number and page size; the default page size is 20
     * @return a page of greetings
     */
    Page<GreetingResponse> getGreetings(Pageable pageable);
}
