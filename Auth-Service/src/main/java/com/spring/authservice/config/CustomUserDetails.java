package com.spring.authservice.config;

import com.spring.authservice.entity.Person;
import lombok.Getter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.List;

@Getter
public class CustomUserDetails extends User {
    private final Person person;

    public CustomUserDetails(Person person) {
        super(person.getUsername(), person.getPassword(),
                List.of(new SimpleGrantedAuthority(person.getRole())));
        this.person = person;
    }
}
