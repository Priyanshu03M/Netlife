package com.spring.authservice.repository;

import com.spring.authservice.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository extends JpaRepository<Person, String> {
    Person findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
