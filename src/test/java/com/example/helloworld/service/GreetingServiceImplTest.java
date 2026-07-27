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
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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

    @Test
    void getGreetingsRequestsPageSortedByDateDescending() {
        Clock clock = Clock.fixed(FIXED_INSTANT, ZoneOffset.UTC);
        GreetingServiceImpl service = new GreetingServiceImpl(greetingRepository, clock);

        Greeting newest = Greeting.builder()
                .id(UUID.randomUUID())
                .name("Newest")
                .date(FIXED_INSTANT)
                .response("Hello, Newest!")
                .build();
        Greeting oldest = Greeting.builder()
                .id(UUID.randomUUID())
                .name("Oldest")
                .date(FIXED_INSTANT.minusSeconds(60))
                .response("Hello, Oldest!")
                .build();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(greetingRepository.findAll(pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(newest, oldest)));

        Page<GreetingResponse> page = service.getGreetings(PageRequest.of(1, 20));

        Pageable used = pageableCaptor.getValue();
        assertThat(used.getPageNumber()).isEqualTo(1);
        assertThat(used.getPageSize()).isEqualTo(20);
        assertThat(used.getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "date"));

        assertThat(page.getContent()).extracting(GreetingResponse::name)
                .containsExactly("Newest", "Oldest");
        assertThat(page.getContent().getFirst().response()).isEqualTo("Hello, Newest!");
    }
}
