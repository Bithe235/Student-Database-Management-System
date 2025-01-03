import React, { ReactNode } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { SQLiteDatabase } from 'expo-sqlite';

const databaseName = 'school.db';

interface CountResult {
  count: number;
}

export const migrateDbIfNeeded = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    -- Recreate tables
    CREATE TABLE IF NOT EXISTS Students (
      StudentID INTEGER PRIMARY KEY NOT NULL,
      Roll TEXT NOT NULL,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      DateOfBirth DATE,
      Email TEXT,
      Department TEXT NOT NULL,
      Batch TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Courses (
      CourseID INTEGER PRIMARY KEY NOT NULL,
      CourseName TEXT NOT NULL,
      CourseDescription TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Enrollments (
      EnrollmentID INTEGER PRIMARY KEY NOT NULL,
      StudentID INTEGER,
      CourseID INTEGER,
      EnrollmentDate DATE,
      FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
      FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Grades (
      GradeID INTEGER PRIMARY KEY NOT NULL,
      EnrollmentID INTEGER,
      Grade TEXT NOT NULL,
      FOREIGN KEY (EnrollmentID) REFERENCES Enrollments(EnrollmentID)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Attendance (
      AttendanceID INTEGER PRIMARY KEY NOT NULL,
      EnrollmentID INTEGER,
      AttendanceDate DATE,
      Status TEXT,
      FOREIGN KEY (EnrollmentID) REFERENCES Enrollments(EnrollmentID)
    );
  `);

  // Check if data already exists in the Students table
  const studentsCount = (await db.getAllAsync('SELECT COUNT(*) as count FROM Students')) as CountResult[];
  if (studentsCount[0].count === 0) {
    console.log("No data found in Students table. Inserting sample data...");
    // Insert sample data for Students
    await db.execAsync(`
      INSERT INTO Students (Roll, FirstName, LastName, DateOfBirth, Email, Department, Batch) VALUES
      ('101', 'John', 'Doe', '2000-01-01', 'john.doe@example.com', 'CSE', 'Batch-1'),
      ('102', 'Jane', 'Smith', '2001-02-01', 'jane.smith@example.com', 'EEE', 'Batch-2');
    `);

    // Insert sample data for Courses
    await db.execAsync(`
      INSERT INTO Courses (CourseName, CourseDescription) VALUES
      ('Mathematics', 'Introduction to Algebra and Calculus'),
      ('Physics', 'Fundamentals of Mechanics and Thermodynamics');
    `);

    // Insert sample data for Enrollments
    await db.execAsync(`
      INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate) VALUES
      (1, 1, '2024-01-01'),
      (2, 2, '2024-01-01');
    `);

    // Insert sample data for Grades
    await db.execAsync(`
      INSERT INTO Grades (EnrollmentID, Grade) VALUES
      (1, 'A'),
      (2, 'B');
    `);

    // Insert sample data for Attendance
    await db.execAsync(`
      INSERT INTO Attendance (EnrollmentID, AttendanceDate, Status) VALUES
      (1, '2024-01-10', 'Present'),
      (2, '2024-01-10', 'Absent');
    `);
  }
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => (
  <SQLiteProvider databaseName={databaseName} onInit={migrateDbIfNeeded} useSuspense>
    {children}
  </SQLiteProvider>
);
