package com.example.helloworld.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.helloworld.entity.Greeting;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@DataJpaTest
class GreetingRepositoryTest {

    @Autowired
    private GreetingRepository greetingRepository;

    @Test
    void persistsAllGreetingColumns() {
        UUID id = UUID.randomUUID();
        Instant date = Instant.now().truncatedTo(ChronoUnit.MILLIS);

        greetingRepository.saveAndFlush(Greeting.builder()
                .id(id)
                .name("Bob")
                .date(date)
                .response("Hello, Bob!")
                .build());

        Greeting found = greetingRepository.findById(id).orElseThrow();
        assertThat(found.getName()).isEqualTo("Bob");
        assertThat(found.getResponse()).isEqualTo("Hello, Bob!");
        assertThat(found.getDate()).isEqualTo(date);
    }

    @Test
    void supportsPagingSortedByDateDescending() {
        Instant now = Instant.now();
        for (int i = 0; i < 3; i++) {
            greetingRepository.save(Greeting.builder()
                    .id(UUID.randomUUID())
                    .name("Name" + i)
                    .date(now.minus(i, ChronoUnit.HOURS))
                    .response("Hello, Name" + i + "!")
                    .build());
        }
        greetingRepository.flush();

        var page = greetingRepository.findAll(
                PageRequest.of(0, 2, Sort.by(Sort.Direction.DESC, "date")));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).extracting(Greeting::getName)
                .containsExactly("Name0", "Name1");
    }
}
