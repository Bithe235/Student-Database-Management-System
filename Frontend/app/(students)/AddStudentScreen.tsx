import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { DatabaseProvider } from '../../components/database/DatabaseInit';

const AddStudentScreen: React.FC = () => {
  const db = useSQLiteContext();
  const [roll, setRoll] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [batch, setBatch] = useState<string>('');

  const handleAddStudent = async () => {
    if (roll && firstName && lastName && dateOfBirth && email && department && batch) {
      try {
        await db.runAsync('INSERT INTO Students (Roll, FirstName, LastName, DateOfBirth, Email, Department, Batch) VALUES (?, ?, ?, ?, ?, ?, ?)', 
          [roll, firstName, lastName, dateOfBirth, email, department, batch]);
          await db.runAsync('INSERT INTO Enrollments (StudentID, CourseID, EnrollmentDate) VALUES (?, ?, ?)', 
          [roll, 1, new Date().toISOString()]);
          await db.runAsync('INSERT INTO Grades (EnrollmentID, Grade) VALUES (?, ?)', 
          [roll, 'A']);
          await db.runAsync('INSERT INTO Attendance (EnrollmentID, Status, AttendanceDate) VALUES (?, ?, ?)', 
          [roll, "Present", new Date().toISOString()]);
        Alert.alert('Success', 'Student added successfully');
        setRoll('');
        setFirstName('');
        setLastName('');
        setDateOfBirth('');
        setEmail('');
        setDepartment('');
        setBatch('');
      } catch (error) {
        console.error('Add Student Error:', error);
        Alert.alert('Error', 'Failed to add student');
      }
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Student</Text>
      <TextInput
        style={styles.input}
        placeholder="Roll Number"
        value={roll}
        onChangeText={setRoll}
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Department"
        value={department}
        onChangeText={setDepartment}
      />
      <TextInput
        style={styles.input}
        placeholder="Batch"
        value={batch}
        onChangeText={setBatch}
      />
      <Button title="Add Student" onPress={handleAddStudent} />
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    width: '80%',
  }
});

export default function App() {
  return (
    <DatabaseProvider>
      <AddStudentScreen />
    </DatabaseProvider>
  );
}
