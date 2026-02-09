package com.spring.flamingo.config;

import com.spring.flamingo.entity.Person;
import com.spring.flamingo.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserDetailConfig implements UserDetailsService {

    private final PersonRepository personRepository;

    @Override
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        log.trace("Loading user details for username: {}", username);

        Person person = personRepository.findByUsername(username);

        if (person == null) {
            log.trace("User not found for username: {}", username);
            throw new UsernameNotFoundException("User not found");
        }

        log.trace("User found: id={}, username={}", person.getId(), person.getUsername());

        List<GrantedAuthority> grantedAuthorities =
                List.of(new SimpleGrantedAuthority(person.getRole()));

        log.trace("Assigned authorities: {}", grantedAuthorities);

        return new User(
                person.getUsername(),
                person.getPassword(), // never log this 🔒
                grantedAuthorities
        );
    }
}

