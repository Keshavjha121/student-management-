/**
 * Student model with manual JSON serialization/deserialization.
 * No external libraries used.
 */
public class Student {
    private int id;
    private String name;
    private String email;
    private String rollNumber;
    private String course;

    public Student() {
    }

    public Student(int id, String name, String email, String rollNumber, String course) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.rollNumber = rollNumber;
        this.course = course;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    /**
     * Serialize this student to a JSON string.
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(id).append(",");
        sb.append("\"name\":").append(jsonString(name)).append(",");
        sb.append("\"email\":").append(jsonString(email)).append(",");
        sb.append("\"rollNumber\":").append(jsonString(rollNumber)).append(",");
        sb.append("\"course\":").append(jsonString(course));
        sb.append("}");
        return sb.toString();
    }

    /**
     * Escape a string value for JSON output.
     */
    private static String jsonString(String value) {
        if (value == null) {
            return "null";
        }
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"':
                    sb.append("\\\"");
                    break;
                case '\\':
                    sb.append("\\\\");
                    break;
                case '\n':
                    sb.append("\\n");
                    break;
                case '\r':
                    sb.append("\\r");
                    break;
                case '\t':
                    sb.append("\\t");
                    break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    /**
     * Deserialize a JSON object string into a Student.
     * Uses a simple manual parser — no external libraries.
     */
    public static Student fromJson(String json) {
        Student s = new Student();
        s.id = jsonInt(json, "id", 0);
        s.name = jsonStr(json, "name");
        s.email = jsonStr(json, "email");
        s.rollNumber = jsonStr(json, "rollNumber");
        s.course = jsonStr(json, "course");
        return s;
    }

    /**
     * Extract an integer field from a JSON string.
     */
    private static int jsonInt(String json, String key, int def) {
        String pattern = "\"" + key + "\"";
        int idx = json.indexOf(pattern);
        if (idx == -1) return def;
        int colon = json.indexOf(':', idx + pattern.length());
        if (colon == -1) return def;
        int start = colon + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        if (start == end) return def;
        try {
            return Integer.parseInt(json.substring(start, end).trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    /**
     * Extract a string field from a JSON string, handling escape sequences.
     */
    private static String jsonStr(String json, String key) {
        String pattern = "\"" + key + "\"";
        int idx = json.indexOf(pattern);
        if (idx == -1) return null;
        int colon = json.indexOf(':', idx + pattern.length());
        if (colon == -1) return null;
        int start = colon + 1;
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
        if (start >= json.length() || json.charAt(start) != '"') return null;
        start++; // skip opening quote
        StringBuilder sb = new StringBuilder();
        int i = start;
        while (i < json.length()) {
            char c = json.charAt(i);
            if (c == '\\' && i + 1 < json.length()) {
                char next = json.charAt(i + 1);
                switch (next) {
                    case '"':
                        sb.append('"');
                        i += 2;
                        break;
                    case '\\':
                        sb.append('\\');
                        i += 2;
                        break;
                    case 'n':
                        sb.append('\n');
                        i += 2;
                        break;
                    case 'r':
                        sb.append('\r');
                        i += 2;
                        break;
                    case 't':
                        sb.append('\t');
                        i += 2;
                        break;
                    default:
                        sb.append(next);
                        i += 2;
                }
            } else if (c == '"') {
                break;
            } else {
                sb.append(c);
                i++;
            }
        }
        return sb.toString();
    }
}
