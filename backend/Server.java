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
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // API Context Handler
        server.createContext("/api/students", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                handleCORS(exchange);
                String method = exchange.getRequestMethod();
                String path = exchange.getRequestURI().getPath();

                if ("OPTIONS".equalsIgnoreCase(method)) {
                    sendResponse(exchange, 204, "");
                    return;
                }

                // GET /api/students
                if ("GET".equalsIgnoreCase(method) && path.equals("/api/students")) {
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < studentList.size(); i++) {
                        sb.append(studentList.get(i).toJson());
                        if (i < studentList.size() - 1) sb.append(",");
                    }
                    sb.append("]");
                    sendResponse(exchange, 200, sb.toString());
                    return;
                }

                // POST /api/students
                if ("POST".equalsIgnoreCase(method)) {
                    InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                    BufferedReader br = new BufferedReader(isr);
                    StringBuilder body = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        body.append(line);
                    }
                    sendResponse(exchange, 201, "{\"message\":\"Student synced successfully\"}");
                    return;
                }

                // Single student query /api/students/{id}
                if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/students/")) {
                    String subPath = path.substring("/api/students/".length());
                    String[] parts = subPath.split("/");
                    String studentId = parts[0];

                    if (parts.length == 1) {
                        sendResponse(exchange, 200, "{\"studentId\":\"" + studentId + "\", \"status\":\"active\"}");
                    } else if (parts.length == 2 && parts[1].equals("academics")) {
                        sendResponse(exchange, 200, "{\"studentId\":\"" + studentId + "\", \"records\":[]}");
                    } else if (parts.length == 2 && parts[1].equals("attendance")) {
                        sendResponse(exchange, 200, "{\"studentId\":\"" + studentId + "\", \"attendance\":[]}");
                    } else if (parts.length == 2 && parts[1].equals("assignments")) {
                        sendResponse(exchange, 200, "{\"studentId\":\"" + studentId + "\", \"assignments\":[]}");
                    } else {
                        sendResponse(exchange, 404, "{\"error\":\"Not Found\"}");
                    }
                    return;
                }

                sendResponse(exchange, 405, "Method Not Allowed");
            }
        });

        System.out.println("Java ERP Student API Server running at http://localhost:" + port);
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