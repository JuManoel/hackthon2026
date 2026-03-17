package edu.ucaldas.hackathon.infra.migration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class BirdSchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public BirdSchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Permite persistir detecciones sin foto y evita fallos por esquemas antiguos.
        jdbcTemplate.execute(
                "ALTER TABLE birds ADD COLUMN IF NOT EXISTS detected_at TIMESTAMP"
        );
        jdbcTemplate.execute(
                "UPDATE birds SET detected_at = NOW() WHERE detected_at IS NULL"
        );
        jdbcTemplate.execute(
                "ALTER TABLE birds ALTER COLUMN detected_at SET NOT NULL"
        );
        jdbcTemplate.execute(
                "ALTER TABLE birds ALTER COLUMN photo_id DROP NOT NULL"
        );
    }
}

