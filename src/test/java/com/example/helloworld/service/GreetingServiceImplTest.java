package com.example.helloworld.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.helloworld.dto.GreetingRequest;
import com.example.helloworld.dto.GreetingResponse;
import com.example.helloworld.entity.Greeting;
import com.example.helloworld.repository.GreetingRepository;
import com.example.helloworld.service.impl.GreetingServiceImpl;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GreetingServiceImplTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2024-01-01T12:00:00Z");

    @Mock
    private GreetingRepository greetingRepository;

    @Test
    void createGreetingBuildsAndPersistsGreeting() {
        Clock clock = Clock.fixed(FIXED_INSTANT, ZoneOffset.UTC);
        GreetingServiceImpl service = new GreetingServiceImpl(greetingRepository, clock);
        when(greetingRepository.save(any(Greeting.class))).thenAnswer(i -> i.getArgument(0));

        GreetingResponse response = service.createGreeting(new GreetingRequest("Carol"));

        ArgumentCaptor<Greeting> captor = ArgumentCaptor.forClass(Greeting.class);
        verify(greetingRepository).save(captor.capture());
        Greeting saved = captor.getValue();

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Carol");
        assertThat(saved.getDate()).isEqualTo(FIXED_INSTANT);
        assertThat(saved.getResponse()).isEqualTo("Hello, Carol!");

        assertThat(response.id()).isEqualTo(saved.getId());
        assertThat(response.name()).isEqualTo("Carol");
        assertThat(response.date()).isEqualTo(FIXED_INSTANT);
        assertThat(response.response()).isEqualTo("Hello, Carol!");
    }
}
