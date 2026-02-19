package com.spring.authservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "person")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person {
    @Id
    private String id;
    private String username;
    private String password;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    private String role;
}
