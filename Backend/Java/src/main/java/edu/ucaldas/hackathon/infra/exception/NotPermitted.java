package edu.ucaldas.hackathon.infra.exception;

public class NotPermitted extends RuntimeException {
    public NotPermitted() {
        super("You are not allowed to perform this action.");
    }

    public NotPermitted(String message) {
        super(message);
    }

    public NotPermitted(String message, Throwable cause) {
        super(message, cause);
    }

    public NotPermitted(Throwable cause) {
        super(cause);
    }

    public NotPermitted(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }
}
