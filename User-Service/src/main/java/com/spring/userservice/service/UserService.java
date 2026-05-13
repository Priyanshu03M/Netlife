package com.spring.userservice.service;

import com.spring.userservice.dto.UserFullInfo;
import com.spring.userservice.dto.UserInfo;
import com.spring.userservice.entity.Person;
import com.spring.userservice.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final PersonRepository personRepository;

    public UserInfo getUserInfo(String username) {
        Optional<Person> person = personRepository.findByUsernameOrEmail(username,  username);
        UserInfo userInfo = null;
        if (person.isPresent()) {
            Person user = person.get();
            userInfo = UserInfo.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .build();
        }
        return userInfo;
    }

    public UserFullInfo getFullUserInfo(String id) {
        return null;
    }
}
