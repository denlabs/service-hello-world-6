package com.example.helloworld.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "GREETINGS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Greeting {

    @Id
    @Column(name = "ID", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "NAME", nullable = false, length = 255)
    private String name;

    @Column(name = "DATE", nullable = false)
    private Instant date;

    @Column(name = "RESPONSE", nullable = false, length = 512)
    private String response;
}
