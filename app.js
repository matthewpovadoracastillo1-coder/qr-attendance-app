// Global Variables
let students = [];
let attendance = {};
let schoolInfo = {};
let scanner = null;
let scanLog = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setTodayDate();
    updateStudentList();
    updateAttendanceSummary();
});

// Save setup
function saveSetup() {
    schoolInfo = {
        schoolName: document.getElementById('schoolName').value,
        schoolId: document.getElementById('schoolId').value,
        district: document.getElementById('district').value,
        division: document.getElementById('division').value,
        region: document.getElementById('region').value,
        schoolYear: document.getElementById('schoolYear').value,
        gradeLevel: document.getElementById('gradeLevel').value,
        section: document.getElementById('section').value,
        trackStrand: document.getElementById('trackStrand').value,
        adviserName: document.getElementById('adviserName').value
    };
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
    showToast('Configuration saved!', 'success');
}

// Add student
function addStudent() {
    const lastName = document.getElementById('lastName').value;
    const firstName = document.getElementById('firstName').value;
    const middleName = document.getElementById('middleName').value;
    const gender = document.getElementById('gender').value;

    if (!lastName || !firstName) {
        showToast('Please fill in all fields!', 'error');
        return;
    }

    const student = {
        id: Date.now(),
        fullName: `${lastName}, ${firstName} ${middleName}`.trim(),
        lastName: lastName,
        firstName: firstName,
        middleName: middleName,
        gender: gender,
        createdAt: new Date().toISOString()
    };

    students.push(student);
    saveData();
    updateStudentList();
    updateAttendanceSummary();
    
    document.getElementById('lastName').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('middleName').value = '';
    
    showToast('Student added successfully!', 'success');
}

// Load sample data
function loadSampleData() {
    students = [
        { id: 1, fullName: 'CASTILLO, MATTHEW O.', lastName: 'CASTILLO', firstName: 'MATTHEW', middleName: 'O.', gender: 'M', createdAt: new Date().toISOString() },
        { id: 2, fullName: 'SAMPLE, JOHN D.', lastName: 'SAMPLE', firstName: 'JOHN', middleName: 'D.', gender: 'M', createdAt: new Date().toISOString() },
        { id: 3, fullName: 'STUDENT, JANE M.', lastName: 'STUDENT', firstName: 'JANE', middleName: 'M.', gender: 'F', createdAt: new Date().toISOString() }
    ];
    saveData();
    updateStudentList();
    showToast('Sample data loaded!', 'success');
}

// Delete student
function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        saveData();
        updateStudentList();
        showToast('Student deleted!', 'success');
    }
}

// Update student list UI
function updateStudentList() {
    const list = document.getElementById('studentList');
    
    if (students.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No students added yet.</p></div>';
    } else {
        list.innerHTML = students.map(student => `
            <div class="student-item">
                <div class="student-info">
                    <div class="student-name">
                        ${student.fullName}
                        <span class="gender-badge gender-${student.gender === 'M' ? 'male' : 'female'}">
                            ${student.gender === 'M' ? '♂️ Male' : '♀️ Female'}
                        </span>
                    </div>
                    <div class="student-details">ID: ${student.id}</div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-small" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Update stats
    const total = students.length;
    const males = students.filter(s => s.gender === 'M').length;
    const females = students.filter(s => s.gender === 'F').length;

    document.getElementById('totalStudents').textContent = total;
    document.getElementById('maleCount').textContent = males;
    document.getElementById('femaleCount').textContent = females;

    // Update manual attendance list
    updateManualList();
}

// Update manual attendance list
function updateManualList() {
    const list = document.getElementById('manualStudentList');
    const date = document.getElementById('manualDate').value;

    if (students.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No students to mark.</p></div>';
        return;
    }

    const dateAttendance = attendance[date] || {};

    list.innerHTML = students.map(student => {
        const status = dateAttendance[student.id]?.status || 'PRESENT';
        return `
            <div class="student-item">
                <div class="student-info">
                    <div class="student-name">${student.fullName}</div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-${status === 'PRESENT' ? 'success' : 'danger'} btn-small" 
                            onclick="markAttendance('${date}', ${student.id}, '${status === 'PRESENT' ? 'ABSENT' : 'PRESENT'}')">
                        ${status === 'PRESENT' ? '✓ Present' : '✗ Absent'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Mark attendance
function markAttendance(date, studentId, status) {
    if (!attendance[date]) {
        attendance[date] = {};
    }

    attendance[date][studentId] = {
        status: status,
        timestamp: new Date().toISOString()
    };

    saveData();
    updateManualList();
    updateAttendanceSummary();
}

// Generate all QR codes
function generateAllQR() {
    const container = document.getElementById('qrContainer');
    
    if (students.length === 0) {
        showToast('No students to generate QR codes for!', 'error');
        return;
    }

    let html = '<div class="qr-grid">';

    students.forEach(student => {
        const qrData = JSON.stringify({
            id: student.id,
            name: student.fullName,
            school: schoolInfo.schoolName,
            timestamp: new Date().toISOString()
        });

        html += `
            <div class="qr-item">
                <div id="qr-${student.id}"></div>
                <p style="font-size: 0.8em; margin-top: 10px; word-break: break-word;">
                    ${student.fullName}
                </p>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Generate QR codes
    students.forEach(student => {
        const qrData = JSON.stringify({
            id: student.id,
            name: student.fullName,
            school: schoolInfo.schoolName
        });

        new QRCode(document.getElementById(`qr-${student.id}`), {
            text: qrData,
            width: 120,
            height: 120,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    });

    showToast('QR codes generated!', 'success');
}

// Start scanner
function startScanner() {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: 250 },
        false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    scanner = html5QrcodeScanner;

    document.getElementById('startScanBtn').classList.add('hidden');
    document.getElementById('stopScanBtn').classList.remove('hidden');
    document.getElementById('scanStatus').textContent = 'Camera is active - Scan QR code';
}

// Stop scanner
function stopScanner() {
    if (scanner) {
        scanner.clear();
    }
    document.getElementById('reader').innerHTML = '<p style="color: #999;">Camera stopped</p>';
    document.getElementById('startScanBtn').classList.remove('hidden');
    document.getElementById('stopScanBtn').classList.add('hidden');
    document.getElementById('scanStatus').textContent = 'Ready to scan';
}

// On scan success
function onScanSuccess(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        const studentId = data.id;
        const student = students.find(s => s.id === studentId);

        if (!student) {
            showToast('Student not found!', 'error');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        if (!attendance[today]) {
            attendance[today] = {};
        }

        // Toggle attendance
        const currentStatus = attendance[today][studentId]?.status;
        const newStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';

        attendance[today][studentId] = {
            status: newStatus,
            timestamp: new Date().toISOString()
        };

        saveData();
        updateAttendanceSummary();
        addScanLog(student.fullName, newStatus);

        showToast(`${student.fullName}: ${newStatus}`, 'success');

    } catch (e) {
        showToast('Invalid QR code format!', 'error');
    }
}

// On scan error
function onScanError(error) {
    // Ignore scanning errors
}

// Add scan log
function addScanLog(name, status) {
    const log = document.getElementById('scanLog');
    const time = new Date().toLocaleTimeString();
    const logHTML = `<div class="log-item ${status.toLowerCase()}">
        <span>${name}</span>
        <span>${status} - ${time}</span>
    </div>`;

    const content = log.querySelector('.empty-state');
    if (content) {
        content.remove();
    }

    log.innerHTML = logHTML + log.innerHTML;

    if (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

// Export SF2
function exportSF2() {
    const month = parseInt(document.getElementById('exportMonth').value);
    const wb = XLSX.utils.book_new();
    
    // Create SF2 sheet
    const wsData = createSF2Data(month);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "SF2");
    
    const filename = `SF2_${schoolInfo.section}_${month}_${schoolInfo.schoolYear}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showToast('SF2 file exported!', 'success');
}

// Create SF2 data
function createSF2Data(month) {
    const data = [];
    
    // Header
    data.push(['SCHOOL FORM 2 - DAILY ATTENDANCE REPORT OF LEARNERS']);
    data.push([]);
    data.push(['School Name:', schoolInfo.schoolName, '', 'School ID:', schoolInfo.schoolId, '', 'District:', schoolInfo.district]);
    data.push(['Grade Level:', schoolInfo.gradeLevel, '', 'Section:', schoolInfo.section]);
    data.push(['School Year:', schoolInfo.schoolYear, '', 'Month:', getMonthName(month)]);
    data.push([]);
    
    // Column headers
    data.push(['No.', 'Student Name', 'Gender', 'Present', 'Absent', 'Attendance %']);
    
    // Student data
    let totalPresent = 0;
    let totalAbsent = 0;

    students.forEach((student, index) => {
        let present = 0;
        let absent = 0;

        for (let day = 1; day <= 31; day++) {
            const dateStr = `${new Date().getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAttendance = attendance[dateStr] || {};
            const status = dayAttendance[student.id]?.status;
            
            if (status === 'PRESENT') present++;
            if (status === 'ABSENT') absent++;
        }

        const total = present + absent;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        data.push([
            index + 1,
            student.fullName,
            student.gender === 'M' ? 'Male' : 'Female',
            present,
            absent,
            percentage + '%'
        ]);

        totalPresent += present;
        totalAbsent += absent;
    });

    data.push([]);
    data.push(['TOTAL', '', '', totalPresent, totalAbsent, '']);
    data.push(['Prepared by:', schoolInfo.adviserName, '', 'Date:', new Date().toLocaleDateString()]);

    return data;
}

// Export JSON
function exportJSON() {
    const data = {
        schoolInfo,
        students,
        attendance,
        exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('JSON file exported!', 'success');
}

// Export backup
function exportAsBackup() {
    const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        schoolInfo,
        students,
        attendance
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Backup created!', 'success');
}

// Update attendance summary
function updateAttendanceSummary() {
    const month = parseInt(document.getElementById('exportMonth').value);
    let totalPresent = 0;
    let totalAbsent = 0;

    students.forEach(student => {
        for (let day = 1; day <= 31; day++) {
            const dateStr = `${new Date().getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAttendance = attendance[dateStr] || {};
            const status = dayAttendance[student.id]?.status;
            
            if (status === 'PRESENT') totalPresent++;
            if (status === 'ABSENT') totalAbsent++;
        }
    });

    const total = totalPresent + totalAbsent;
    const rate = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    document.getElementById('summaryPresent').textContent = totalPresent;
    document.getElementById('summaryAbsent').textContent = totalAbsent;
    document.getElementById('summaryRate').textContent = rate + '%';
}

// Show/hide tabs
function showTab(tabName, button) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    button.classList.add('active');
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
        students = [];
        attendance = {};
        schoolInfo = {};
        localStorage.clear();
        location.reload();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
}

// Load data from localStorage
function loadData() {
    const savedSchool = localStorage.getItem('schoolInfo');
    const savedStudents = localStorage.getItem('students');
    const savedAttendance = localStorage.getItem('attendance');

    if (savedSchool) {
        schoolInfo = JSON.parse(savedSchool);
        document.getElementById('schoolName').value = schoolInfo.schoolName;
        document.getElementById('schoolId').value = schoolInfo.schoolId;
        document.getElementById('district').value = schoolInfo.district;
        document.getElementById('division').value = schoolInfo.division;
        document.getElementById('region').value = schoolInfo.region;
        document.getElementById('schoolYear').value = schoolInfo.schoolYear;
        document.getElementById('gradeLevel').value = schoolInfo.gradeLevel;
        document.getElementById('section').value = schoolInfo.section;
        document.getElementById('trackStrand').value = schoolInfo.trackStrand;
        document.getElementById('adviserName').value = schoolInfo.adviserName;
    }

    if (savedStudents) students = JSON.parse(savedStudents);
    if (savedAttendance) attendance = JSON.parse(savedAttendance);
}

// Set today's date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('manualDate').value = today;
}

// Get month name
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
}

// Show toast notification
function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
