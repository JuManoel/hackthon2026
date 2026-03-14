package edu.ucaldas.hackathon.models;

public enum Role {
    ADMIN("ADMIN"),
    GUIDE("GUIDE");

    private String role;

    Role(String role) {
        this.role = role;
    }

    public String fromString(String role) {
        for (Role r : Role.values()) {
            if (r.role.equalsIgnoreCase(role)) {
                return r.role;
            }
        }
        throw new IllegalArgumentException("Invalid role: " + role);
    }
}
