package com.spring.authservice.repository;

import com.spring.authservice.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PersonRepository extends JpaRepository<Person, String> {
    Optional<Person> findByUsernameOrEmail(String username, String email);
}
