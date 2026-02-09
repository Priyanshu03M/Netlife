CREATE TABLE refresh_token (
                               id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                               token VARCHAR(255) NOT NULL,
                               person_id VARCHAR(50) UNIQUE,
                               expiry_date TIMESTAMP,
                               CONSTRAINT fk_person
                                   FOREIGN KEY (person_id)
                                       REFERENCES person(id)
);