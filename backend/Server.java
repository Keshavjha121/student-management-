import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class Server {

    // In-memory dummy students list for initial setup
    static class Student {
        String id;
        String rollNo;
        String name;
        String department;
        int semester;
        double cgpa;
        int attendance;

        Student(String id, String rollNo, String name, String department, int semester, double cgpa, int attendance) {
            this.id = id;
            this.rollNo = rollNo;
            this.name = name;
            this.department = department;
            this.semester = semester;
            this.cgpa = cgpa;
            this.attendance = attendance;
        }

        String toJson() {
            return String.format(
                "{\"id\":\"%s\",\"rollNo\":\"%s\",\"name\":\"%s\",\"department\":\"%s\",\"semester\":%d,\"cgpa\":%.2f,\"attendance\":%d}",
                id, rollNo, name, department, semester, cgpa, attendance
            );
        }
    }

    private static final List<Student> studentList = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        int port = 8080;

        // Sample initial records
        studentList.add(new Student("1", "R001", "Prafull Gupta", "CSE", 5, 8.73, 86));
        studentList.add(new Student("2", "R002", "Aman Sharma", "ISE", 4, 7.90, 78));
        studentList.add(new Student("3", "R003", "Pooja Verma", "ECE", 6, 8.20, 92));

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // 1. Dashboard Metrics API
        server.createContext("/api/dashboard", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                handleCORS(exchange);
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendResponse(exchange, 204, "");
                    return;
                }

                String json = "{"
                    + "\"totalStudents\": 1248,"
                    + "\"totalFaculty\": 84,"
                    + "\"totalCourses\": 12,"
                    + "\"totalSubjects\": 48,"
                    + "\"avgCgpa\": 7.85,"
                    + "\"avgAttendance\": 84.2,"
                    + "\"passPercentage\": 91.5"
                    + "}";

                sendResponse(exchange, 200, json);
            }
        });

        // 2. Students List & Add Student API
        server.createContext("/api/students", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                handleCORS(exchange);
                String method = exchange.getRequestMethod();

                if ("OPTIONS".equalsIgnoreCase(method)) {
                    sendResponse(exchange, 204, "");
                    return;
                }

                if ("GET".equalsIgnoreCase(method)) {
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < studentList.size(); i++) {
                        sb.append(studentList.get(i).toJson());
                        if (i < studentList.size() - 1) sb.append(",");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                } else if ("POST".equalsIgnoreCase(method)) {
                    InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                    BufferedReader br = new BufferedReader(isr);
                    StringBuilder body = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        body.append(line);
                    }

                    // Simple auto-add dummy entry upon request
                    String newId = String.valueOf(studentList.size() + 1);
                    studentList.add(new Student(newId, "R00" + newId, "New Student", "CSE", 1, 7.50, 85));

                    sendResponse(exchange, 201, "{\"message\":\"Student added successfully\"}");
                } else {
                    sendResponse(exchange, 405, "Method Not Allowed");
                }
            }
        });

        // 3. Academic Risk Prediction API
        server.createContext("/api/prediction", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                handleCORS(exchange);
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    sendResponse(exchange, 204, "");
                    return;
                }

                // Returns ML prediction weights for student risk assessment
                String json = "{"
                    + "\"studentId\": \"R001\","
                    + "\"attendance\": 84,"
                    + "\"previousSgpa\": 8.2,"
                    + "\"assignmentRate\": 92,"
                    + "\"currentAverage\": 81,"
                    + "\"riskLevel\": \"LOW\""
                    + "}";

                sendResponse(exchange, 200, json);
            }
        });

        System.out.println("Java ERP Server running at: http://localhost:" + port);
        server.start();
    }

    private static void handleCORS(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }
}