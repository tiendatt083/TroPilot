package com.tropilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TropilotApplication {

    public static void main(String[] args) {
        SpringApplication.run(TropilotApplication.class, args);
    }
}
