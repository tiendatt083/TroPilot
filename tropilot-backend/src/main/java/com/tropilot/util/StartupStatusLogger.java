package com.tropilot.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupStatusLogger {

    private static final String LINE = "------------------------------------------------------------";

    private final JdbcTemplate jdbcTemplate;
    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void logStartupStatus() {
        String port = environment.getProperty(
                "local.server.port",
                environment.getProperty("server.port", "8080")
        );

        try {
            String databaseName = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            String databaseVersion = jdbcTemplate.queryForObject("SELECT VERSION()", String.class);

            log.info("""

                    {}
                    Tropilot backend is running
                    Backend URL: http://localhost:{}
                    Database connection: successful
                    Database name: {}
                    Database version: {}
                    {}
                    """, LINE, port, valueOrUnknown(databaseName), valueOrUnknown(databaseVersion), LINE);
        } catch (DataAccessException exception) {
            String reason = exception.getMostSpecificCause() == null
                    ? exception.getMessage()
                    : exception.getMostSpecificCause().getMessage();

            log.error("""

                    {}
                    Tropilot backend started, but the database connection check failed
                    Backend URL: http://localhost:{}
                    Database connection: failed
                    Reason: {}
                    {}
                    """, LINE, port, valueOrUnknown(reason), LINE);
        }
    }

    private String valueOrUnknown(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }

        return value;
    }
}
