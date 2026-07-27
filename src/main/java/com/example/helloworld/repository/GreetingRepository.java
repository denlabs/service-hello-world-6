package com.example.helloworld.repository;

import com.example.helloworld.entity.Greeting;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GreetingRepository extends JpaRepository<Greeting, UUID> {
}
