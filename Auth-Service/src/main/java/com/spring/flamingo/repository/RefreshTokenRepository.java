package com.spring.flamingo.repository;

import com.spring.flamingo.entity.Person;
import com.spring.flamingo.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> getByToken(String token);
    void deleteAllByPerson(Person person);
}
