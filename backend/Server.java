import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.Executors;

/**
 * Standalone RESTful HTTP server using only the Java standard library.
 * Stores students in a thread-safe in-memory map with auto-incrementing IDs.
 */
public class Server {

    private static final ConcurrentHashMap<Integer, Student> store = new ConcurrentHashMap<>();
    private static final AtomicInteger idCounter = new AtomicInteger(0);

    public static void main(String[] args) throws IOException {
        // Pre-populate sample students
        addStudent(new Student(0, "Alice Johnson", "alice@example.com", "R001", "Computer Science"));
        addStudent(new Student(0, "Bob Smith", "bob@example.com", "R002", "Mathematics"));
        addStudent(new Student(0, "Charlie Brown", "charlie@example.com", "R003", "Physics"));

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/students", new StudentHandler());
        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();
        System.out.println("Server started on http://localhost:8080");
        System.out.println("Endpoints:");
        System.out.println("  GET    /api/students          - list all students");
        System.out.println("  GET    /api/students?id=1     - get a single student");
        System.out.println("  POST   /api/students          - create a student");
        System.out.println("  PUT    /api/students?id=1     - update a student");
        System.out.println("  DELETE /api/students?id=1     - delete a student");
    }

    /**
     * Add a student to the store, assigning the next auto-incremented ID.
     */
    private static Student addStudent(Student s) {
        int id = idCounter.incrementAndGet();
        s.setId(id);
        store.put(id, s);
        return s;
    }

    /**
     * Convert all students in the store to a JSON array string.
     */
    private static String allStudentsJson() {
        List<Student> list = new ArrayList<>(store.values());
        list.sort((a, b) -> Integer.compare(a.getId(), b.getId()));
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append(list.get(i).toJson());
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Parse an integer query parameter from the request URI.
     */
    private static Integer parseIdFromQuery(URI uri) {
        String query = uri.getQuery();
        if (query == null || query.isEmpty()) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals("id")) {
                try {
                    return Integer.parseInt(kv[1]);
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Read the entire request body as a UTF-8 string.
     */
    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        byte[] buffer = new byte[4096];
        int bytesRead;
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        while ((bytesRead = is.read(buffer)) != -1) {
            baos.write(buffer, 0, bytesRead);
        }
        is.close();
        return baos.toString(StandardCharsets.UTF_8.name());
    }

    /**
     * Send a JSON response with CORS headers.
     */
    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        setCorsHeaders(exchange);
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    /**
     * Set standard CORS headers on the response.
     */
    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    /**
     * Send a simple error message as JSON.
     */
    private static void sendError(HttpExchange exchange, int status, String message) throws IOException {
        sendJson(exchange, status, "{\"error\":\"" + message + "\"}");
    }

    /**
     * Handler for /api/students — supports GET, POST, PUT, DELETE, OPTIONS.
     */
    static class StudentHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            try {
                switch (method) {
                    case "OPTIONS":
                        handleOptions(exchange);
                        break;
                    case "GET":
                        handleGet(exchange);
                        break;
                    case "POST":
                        handlePost(exchange);
                        break;
                    case "PUT":
                        handlePut(exchange);
                        break;
                    case "DELETE":
                        handleDelete(exchange);
                        break;
                    default:
                        sendError(exchange, 405, "Method Not Allowed");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, "Internal Server Error");
            }
        }

        private void handleOptions(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            exchange.sendResponseHeaders(204, -1);
            exchange.getResponseBody().close();
        }

        private void handleGet(HttpExchange exchange) throws IOException {
            Integer id = parseIdFromQuery(exchange.getRequestURI());
            if (id != null) {
                Student s = store.get(id);
                if (s == null) {
                    sendError(exchange, 404, "Student not found");
                } else {
                    sendJson(exchange, 200, s.toJson());
                }
            } else {
                sendJson(exchange, 200, allStudentsJson());
            }
        }

        private void handlePost(HttpExchange exchange) throws IOException {
            String body = readBody(exchange);
            if (body.isEmpty()) {
                sendError(exchange, 400, "Request body is empty");
                return;
            }
            Student s = Student.fromJson(body);
            if (s.getName() == null || s.getName().isEmpty()) {
                sendError(exchange, 400, "Name is required");
                return;
            }
            Student created = addStudent(s);
            sendJson(exchange, 201, created.toJson());
        }

        private void handlePut(HttpExchange exchange) throws IOException {
            Integer id = parseIdFromQuery(exchange.getRequestURI());
            if (id == null) {
                sendError(exchange, 400, "Missing id query parameter");
                return;
            }
            Student existing = store.get(id);
            if (existing == null) {
                sendError(exchange, 404, "Student not found");
                return;
            }
            String body = readBody(exchange);
            if (body.isEmpty()) {
                sendError(exchange, 400, "Request body is empty");
                return;
            }
            Student updated = Student.fromJson(body);
            updated.setId(id);
            store.put(id, updated);
            sendJson(exchange, 200, updated.toJson());
        }

        private void handleDelete(HttpExchange exchange) throws IOException {
            Integer id = parseIdFromQuery(exchange.getRequestURI());
            if (id == null) {
                sendError(exchange, 400, "Missing id query parameter");
                return;
            }
            Student removed = store.remove(id);
            if (removed == null) {
                sendError(exchange, 404, "Student not found");
                return;
            }
            sendJson(exchange, 200, "{\"message\":\"Student deleted\",\"id\":" + id + "}");
        }
    }
}
