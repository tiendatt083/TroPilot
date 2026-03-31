package com.rentalhub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RentalHubApplication {

    public static void main(String[] args) {
        org.springframework.context.ApplicationContext context = SpringApplication.run(RentalHubApplication.class,
                args);
        String port = context.getEnvironment().getProperty("server.port", "8080");
        System.out.println("\n---------------------------------------------------------");
        System.out.println("YOU ARE RUNNING AT PORT: " + port);
        System.out.println("ACCESS LINK: http://localhost:" + port);
        System.out.println("---------------------------------------------------------\n");
    }
}
