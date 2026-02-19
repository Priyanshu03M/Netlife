package com.spring.authservice.repository;

import com.spring.authservice.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, String> {
    Person findByUsername(String username);
}
