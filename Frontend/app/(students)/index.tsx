import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Button, TextInput, SectionList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import { DatabaseProvider } from '../../components/database/DatabaseInit';
import { generatePdf } from '../../components/CreatePDF'; 
interface Student {
  StudentID: number;
  Roll: string;
  FirstName: string;
  LastName: string;
  Department: string;
  Batch: string;
}

interface Course {
  CourseID: number;
  CourseName: string;
}

interface Enrollment {
  EnrollmentID: number;
  StudentID: number;
  CourseID: number;
  EnrollmentDate: string;
}

interface Grade {
  GradeID: number;
  EnrollmentID: number;
  Grade: string;
}

interface Attendance {
  AttendanceID: number;
  EnrollmentID: number;
  AttendanceDate: string;
  Status: string;
}

type SectionItem = Student | Enrollment | Grade | Attendance;

const HomeScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchRollNumber, setSearchRollNumber] = useState<string>('');
  const [searchDepartment, setSearchDepartment] = useState<string>('');
  const [searchBatch, setSearchBatch] = useState<string>('');
  const [searchResult, setSearchResult] = useState<Student | null>(null);
  const handleGeneratePdf = () => { generatePdf(db); };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsData: Student[] = await db.getAllAsync('SELECT * FROM Students');
        setStudents(studentsData);
        
        console.log("Students Data",studentsData);
        const coursesData: Course[] = await db.getAllAsync('SELECT * FROM Courses');
        setCourses(coursesData);
        console.log("Courses Data",coursesData); 

        const enrollmentsData: Enrollment[] = await db.getAllAsync('SELECT * FROM Enrollments');
        console.log("Enrollments Data",enrollmentsData);
        setEnrollments(enrollmentsData);
        
        const gradesData: Grade[] = await db.getAllAsync('SELECT * FROM Grades');
        setGrades(gradesData);
        console.log("Grades Data",gradesData);
        const attendanceData: Attendance[] = await db.getAllAsync('SELECT * FROM Attendance');
        setAttendance(attendanceData);
        console.log("Attendance Data",attendanceData);
      } catch (error) {
        console.error('Database Error:', error);
      }
    };

    fetchData();
  }, [db]);

  const handleSearch = async () => {
    try {
      const result: Student[] = await db.getAllAsync('SELECT * FROM Students WHERE Roll = ? AND Department = ? AND Batch = ?', [searchRollNumber, searchDepartment, searchBatch]);
      if (result.length > 0) {
        setSearchResult(result[0]);
        const enrollmentsData: Enrollment[] = await db.getAllAsync('SELECT * FROM Enrollments WHERE StudentID = ?', [result[0].StudentID]);
        setEnrollments(enrollmentsData);

        const gradesData: Grade[] = await db.getAllAsync('SELECT * FROM Grades WHERE EnrollmentID IN (SELECT EnrollmentID FROM Enrollments WHERE StudentID = ?)', [result[0].StudentID]);
        setGrades(gradesData);

        const attendanceData: Attendance[] = await db.getAllAsync('SELECT * FROM Attendance WHERE EnrollmentID IN (SELECT EnrollmentID FROM Enrollments WHERE StudentID = ?)', [result[0].StudentID]);
        setAttendance(attendanceData);
      } else {
        setSearchResult(null);
        setEnrollments([]);
        setGrades([]);
        setAttendance([]);
        alert('Student not found');
      }
    } catch (error) {
      console.error('Search Error:', error);
    }
  };

  const handleEnrollment = async () => {
    if (selectedStudent && selectedCourse) {
      try {
        await db.runAsync('INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate) VALUES (?, ?, ?)', 
          [selectedStudent, selectedCourse, new Date().toISOString()]);
        alert('Enrollment successful');
        const enrollmentsData: Enrollment[] = await db.getAllAsync('SELECT * FROM Enrollments');
        setEnrollments(enrollmentsData);
      } catch (error) {
        console.error('Enrollment Error:', error);
      }
    }
  };

  const handleStudentSelect = async (studentId: number) => {
    setSelectedStudent(studentId);
    try {
      // Get enrollments for selected student
      const enrollmentsData: Enrollment[] = await db.getAllAsync(
        'SELECT e.*, c.CourseName FROM Enrollments e JOIN Courses c ON e.CourseID = c.CourseID WHERE e.StudentID = ?', 
        [studentId]
      );
      setEnrollments(enrollmentsData);

      // Get grades for selected student
      const gradesData: Grade[] = await db.getAllAsync(
        'SELECT g.*, c.CourseName FROM Grades g JOIN Enrollments e ON g.EnrollmentID = e.EnrollmentID JOIN Courses c ON e.CourseID = c.CourseID WHERE e.StudentID = ?',
        [studentId]
      );
      setGrades(gradesData);

      // Get attendance for selected student
      const attendanceData: Attendance[] = await db.getAllAsync(
        'SELECT a.* FROM Attendance a JOIN Enrollments e ON a.EnrollmentID = e.EnrollmentID WHERE e.StudentID = ?',
        [studentId]
      );
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const sections: {
    title: string;
    data: SectionItem[];
  }[] = [
    {
      title: 'Student Profile',
      data: searchResult ? [searchResult] : []
    },
    {
      title: 'Enrollments',
      data: enrollments.map(enrollment => ({
        ...enrollment,
        studentName: students.find(s => s.StudentID === enrollment.StudentID)?.FirstName || 'Unknown',
        courseName: courses.find(c => c.CourseID === enrollment.CourseID)?.CourseName || 'Unknown'
      }))
    },
    {
      title: 'Grades',
      data: grades.map(grade => ({
        ...grade,
        studentName: students.find(s => 
          enrollments.find(e => e.EnrollmentID === grade.EnrollmentID)?.StudentID === s.StudentID
        )?.FirstName || 'Unknown'
      }))
    },
    {
      title: 'Attendance Records',
      data: attendance.map(record => ({
        ...record,
        studentName: students.find(s => 
          enrollments.find(e => e.EnrollmentID === record.EnrollmentID)?.StudentID === s.StudentID
        )?.FirstName || 'Unknown'
      }))
    }
  ];
  

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter Roll Number"
        value={searchRollNumber}
        onChangeText={setSearchRollNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Department"
        value={searchDepartment}
        onChangeText={setSearchDepartment}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Batch"
        value={searchBatch}
        onChangeText={setSearchBatch}
      />
      <Button title="Search" onPress={handleSearch} />
     
      <SectionList
        sections={sections}
        keyExtractor={(item: SectionItem, index) => index.toString()}
        renderItem={({ item, section }) => (
          <View style={styles.recordItem}>
            
            {section.title === 'Student Profile' && (
              <>
                <Text style={styles.sectionTitle}>Student Details</Text>
                <Text>Roll: {(item as Student).Roll}</Text>
                <Text>Name: {(item as Student).FirstName} {(item as Student).LastName}</Text>
                <Text>Department: {(item as Student).Department}</Text>
                <Text>Batch: {(item as Student).Batch}</Text>
              </>
            )}
            
            {section.title === 'Enrollments' && (
              <>
                <Text style={styles.sectionTitle}>Enrollment Details</Text>
                <Text>Student: {(item as any).studentName}</Text>
                <Text>Course: {(item as any).courseName}</Text>
                <Text>Date: {new Date((item as Enrollment).EnrollmentDate).toLocaleDateString()}</Text>
              </>
            )}
            
            {section.title === 'Grades' && (
              <>
                <Text style={styles.sectionTitle}>Grade Details</Text>
                <Text>Student: {(item as any).studentName}</Text>
                <Text>Grade: {(item as Grade).Grade}</Text>
              </>
            )}
            
            {section.title === 'Attendance Records' && (
              <>
                <Text style={styles.sectionTitle}>Attendance Details</Text>
                <Text>Student: {(item as any).studentName}</Text>
                <Text>Date: {new Date((item as Attendance).AttendanceDate).toLocaleDateString()}</Text>
                <Text>Status: {(item as Attendance).Status}</Text>
              </>
            )}
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.title}>{title}</Text>
        )}
      />

      <Text style={styles.title}>Enroll in a Course</Text>
      <Picker
        selectedValue={selectedStudent}
        onValueChange={(itemValue) => {
          if (itemValue !== null) {
            handleStudentSelect(itemValue);
          }
        }}
        style={styles.picker}
      >
        {students.map(student => (
          <Picker.Item key={student.StudentID} label={`${student.FirstName} ${student.LastName}`} value={student.StudentID} />
        ))}
      </Picker>
      <Picker
        selectedValue={selectedCourse}
        onValueChange={(itemValue) => setSelectedCourse(itemValue)}
        style={styles.picker}
      >
        {courses.map(course => (
          <Picker.Item key={course.CourseID} label={course.CourseName} value={course.CourseID} />
        ))}
      </Picker>
      <Button title="Enroll" onPress={handleEnrollment} />
      <View style={styles.pdfButton}>
        <Button title="Generate PDF Report" onPress={handleGeneratePdf} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  profileSection: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    width: '80%',
  },
  picker: {
    height: 50,
    width: 250,
    marginVertical: 10,
  },
  recordItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  pdfButton: {
    marginTop: 10,
  },
});

export default function App() {
  return (
    <DatabaseProvider>
      <HomeScreen />
    </DatabaseProvider>
  );
}
