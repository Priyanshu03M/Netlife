package com.spring.flamingo.repository;

import com.spring.flamingo.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, String> {
    Person findByUsername(String username);
}
