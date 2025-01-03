import { PrintOptions, printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { SQLiteDatabase } from 'expo-sqlite';

interface Student {
  Roll: string;
  FirstName: string;
  LastName: string;
  Department: string;
  Batch: string;
}

interface Course {
  CourseName: string;
  CourseDescription: string;
}

interface Enrollment {
  StudentID: number;
  CourseID: number;
  EnrollmentDate: string;
}

interface Grade {
  EnrollmentID: number;
  Grade: string;
}

interface Attendance {
  EnrollmentID: number;
  AttendanceDate: string;
  Status: string;
}

export const generatePdf = async (db: SQLiteDatabase) => {
  try {
    // Fetch data from database
    const students: Student[] = await db.getAllAsync('SELECT * FROM Students');
    const courses: Course[] = await db.getAllAsync('SELECT * FROM Courses');
    const enrollments: Enrollment[] = await db.getAllAsync('SELECT * FROM Enrollments');
    const grades: Grade[] = await db.getAllAsync('SELECT * FROM Grades');
    const attendance: Attendance[] = await db.getAllAsync('SELECT * FROM Attendance');

    // Format data into HTML for PDF
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Student Information System Report</h1>
          <h2>Students</h2>
          <table>
            <tr><th>Roll</th><th>First Name</th><th>Last Name</th><th>Department</th><th>Batch</th></tr>
            ${students.map(student => `<tr><td>${student.Roll}</td><td>${student.FirstName}</td><td>${student.LastName}</td><td>${student.Department}</td><td>${student.Batch}</td></tr>`).join('')}
          </table>
          <h2>Courses</h2>
          <table>
            <tr><th>Course Name</th><th>Course Description</th></tr>
            ${courses.map(course => `<tr><td>${course.CourseName}</td><td>${course.CourseDescription}</td></tr>`).join('')}
          </table>
          <h2>Enrollments</h2>
          <table>
            <tr><th>Student ID</th><th>Course ID</th><th>Enrollment Date</th></tr>
            ${enrollments.map(enrollment => `<tr><td>${enrollment.StudentID}</td><td>${enrollment.CourseID}</td><td>${enrollment.EnrollmentDate}</td></tr>`).join('')}
          </table>
          <h2>Grades</h2>
          <table>
            <tr><th>Enrollment ID</th><th>Grade</th></tr>
            ${grades.map(grade => `<tr><td>${grade.EnrollmentID}</td><td>${grade.Grade}</td></tr>`).join('')}
          </table>
          <h2>Attendance</h2>
          <table>
            <tr><th>Enrollment ID</th><th>Attendance Date</th><th>Status</th></tr>
            ${attendance.map(att => `<tr><td>${att.EnrollmentID}</td><td>${att.AttendanceDate}</td><td>${att.Status}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;

    const pdfFilePath = await createPdf(htmlContent);
    await shareAsync(pdfFilePath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

const createPdf = async (htmlContent: string) => {
  try {
    const options = {
      html: htmlContent,
      base64: false
    };

    const { uri } = await printToFileAsync(options);
    console.log('PDF created at:', uri);

    const fileUri = `${FileSystem.documentDirectory}StudentInformationSystemReport.pdf`;
    await FileSystem.moveAsync({
      from: uri,
      to: fileUri,
    });

    return fileUri;
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  }
};
