package com.example.helloworld.service.impl;

import com.example.helloworld.dto.GreetingRequest;
import com.example.helloworld.dto.GreetingResponse;
import com.example.helloworld.entity.Greeting;
import com.example.helloworld.repository.GreetingRepository;
import com.example.helloworld.service.GreetingService;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GreetingServiceImpl implements GreetingService {

    /**
     * Default greeting template. The single {@code %s} placeholder is replaced with the
     * submitted name, so a request for {@code "Alice"} produces {@code "Hello, Alice!"}.
     */
    static final String GREETING_TEMPLATE = "Hello, %s!";

    /** Property name used to sort stored greetings; see {@link #GREETING_SORT}. */
    private static final String DATE_PROPERTY = "date";

    /** Greetings are always returned newest first, regardless of any client supplied sort. */
    private static final Sort GREETING_SORT = Sort.by(Sort.Direction.DESC, DATE_PROPERTY);

    private final GreetingRepository greetingRepository;
    private final Clock clock;

    @Override
    @Transactional
    public GreetingResponse createGreeting(GreetingRequest request) {
        Greeting greeting = Greeting.builder()
                .id(UUID.randomUUID())
                .name(request.name())
                .date(Instant.now(clock))
                .response(GREETING_TEMPLATE.formatted(request.name()))
                .build();

        return GreetingResponse.from(greetingRepository.save(greeting));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GreetingResponse> getGreetings(Pageable pageable) {
        Pageable sorted = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                GREETING_SORT);

        return greetingRepository.findAll(sorted).map(GreetingResponse::from);
    }
}
