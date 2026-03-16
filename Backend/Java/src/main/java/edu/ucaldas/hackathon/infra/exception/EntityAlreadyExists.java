package edu.ucaldas.hackathon.infra.exception;

public class EntityAlreadyExists extends RuntimeException {
    public EntityAlreadyExists() {
        super("Entity already exists.");
    }

    public EntityAlreadyExists(String message) {
        super(message);
    }

    public EntityAlreadyExists(String message, Throwable cause) {
        super(message, cause);
    }

    public EntityAlreadyExists(Throwable cause) {
        super(cause);
    }

    public EntityAlreadyExists(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
