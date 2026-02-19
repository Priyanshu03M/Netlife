package com.spring.authservice.repository;

import com.spring.authservice.entity.Person;
import com.spring.authservice.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> getByToken(String token);
    void deleteAllByPerson(Person person);
}
