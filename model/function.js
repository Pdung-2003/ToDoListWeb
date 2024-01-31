let selectedDate;

// DOM elements
const taskInput = document.querySelector('#newtask input[type="text"]');
const timeInput = document.querySelector('#newtask input[type="time"]');
const addButton = document.querySelector('#add');

// Function to format date
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

function changeMonth(step) {
    currentMonth += step;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    currentDate = new Date(currentYear, currentMonth, 1);
    updateCalendar();
}

function updateCalendar() {
    const monthDays = document.querySelector(".calendar-body");
    monthDays.innerHTML = "";
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); 
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate(); // sử dụng getDate trên Date của ngày cuối cùng trong tháng
    document.getElementById('monthYear').innerText = `Tháng ${currentMonth + 1} ${currentYear}`; // cập nhậ tiêu đề lịch vs năm tháng hiện tại

    for (let i = 1; i <= lastDay; i++) { // tạo và thêm các ô vào lịch
        const daySquare = document.createElement('div'); // tạo ptu div mới, gán class day và text là số ngày
        daySquare.classList.add('day');
        daySquare.innerText = i;
        // Thêm thuộc tính data-date cho mỗi daySquare để dễ dàng xác định ngày
        const dayDate = formatDate(new Date(currentYear, currentMonth, i));// chuỗi ngày được định dạng
        daySquare.setAttribute('data-date', dayDate); 
        
        if (dayDate === selectedDate) {
            daySquare.classList.add('selected-day');// thêm thuộc tính vào để chuyển css vào thành ngày đc chọn
        }

        daySquare.addEventListener('click', function() {// thêm sự kiện click cho mỗi ô ngày
            // Cập nhật selectedDate và gọi fetchTasksForDate
            selectedDate = dayDate;
            updateSelectedDay(dayDate);
            fetchTasksForDate(selectedDate); // Gọi API và hiển thị các công việc
        });

        monthDays.appendChild(daySquare); // thêm ô ngày vào lịch
    }
}

// Hàm mới để cập nhật ngày được chọn
function updateSelectedDay(newSelectedDate) {
    // tìm ngày hiện tại
    const currentlySelectedDay = document.querySelector('.calendar-body .selected-day');
    if (currentlySelectedDay) {
        currentlySelectedDay.classList.remove('selected-day'); // bỏ chọn ngày hiện tại
    }
    
    // tìm ngày mới được chọn trên lịch có data-date trùng newSelectedDate
    const newSelectedDayElement = document.querySelector(`.calendar-body .day[data-date="${newSelectedDate}"]`);
    if (newSelectedDayElement) {
        newSelectedDayElement.classList.add('selected-day'); // thêm thuộc tính selected-day vào 
    }
}
// Chức năng hiển thị các công việc khi người dùng login vào và chọn 1 ngày
function displayTasksForDate(tasks) {
    const tasksDiv = document.querySelector('#tasks');// truy cập vào phần tử trong DOM có id là tasks
    tasksDiv.innerHTML = ''; // Xóa các công việc cũ
    tasks.forEach(task => {
        const taskDateTime = new Date(task.CreateAt);
        // chuyển Date trong js thành 1 chuỗi tgian để dễ độc theo định dạng địa phương, chỉ hiện thị giờ và phút
        const formattedTime = taskDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
        const taskClass = task.IsCompleted ? 'task completed' : 'task'; // nếu mà là task complected thì sẽ nhận giá trị task COmpleted còn không thì là task
        /* thêm HTML cho công việc vào tasksDiv gồm tên, thời gian được định dạng và 1 nút để xóa công việc
        span hiển thị tên và date định dạng giờ phút, button delete, khi nhấm gọi deleteTask*/
        tasksDiv.innerHTML += ` 
            <div class="${taskClass}" data-task-id="${task.TaskID}">
                <span>${task.TaskName} - ${formattedTime}</span> 
                <button class="delete" onclick="deleteTask(event, ${task.TaskID})">
                    <i class="far fa-trash-alt"></i>
                </button>
            </div>
        `;
        
    });
}

// Chức năng lấy các công việc từ server dựa trên ngày đã chọn
function fetchTasksForDate(date) {
    // Gửi yêu cầu GET đến server tới endpoint '/tasks' với tham số 'date'
    fetch(`/tasks?date=${date}`)
        // Đợi phản hồi từ server, sau đó chuyển đổi dữ liệu từ JSON sang đối tượng JavaScript
        .then(response => response.json())
        .then(tasks => {
            displayTasksForDate(tasks);
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}

function addTask() {
    if (taskInput.value.length === 0) {
        alert("Please Enter a Task");
    } else {
        const taskName = taskInput.value;
        const taskTime = timeInput.value;
        
        // Sử dụng fetch để thêm task
        fetch('/add-task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskName: taskName,
                taskTime: taskTime,
                date: selectedDate
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                fetchTasksForDate(selectedDate); // Gọi lại danh sách tasks sau khi thêm task
            } else {
                alert("Failed to add task: " + data.message);
            }
        })
        .catch(error => {
            console.error('Error adding task:', error);
        });
        
        taskInput.value = "";
        timeInput.value = "";
    }
}

// Thêm sự kiện click cho nút Thêm Task
addButton.addEventListener('click', addTask);

// Sử dụng fetch để xóa task
function deleteTask(event, taskID) {
    event.stopPropagation(); // Ngăn chặn sự kiện nổi bọt

    // Gửi request POST đến server
    fetch('/delete-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskID }) // Không cần ghi là taskID: taskID vì key và value giống nhau
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Xóa task khỏi DOM
            const taskElement = document.querySelector(`.task[data-task-id="${taskID}"]`);
            if (taskElement) {
                taskElement.remove(); // Xóa element khỏi DOM
            }
        } else {
            alert("Failed to delete task: " + data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting task:', error);
    });
}

// Cập nhật hàm searchTasks để sử dụng hàm updateSelectedDay
function searchTasks(searchTerm) {
    // Tạo một yêu cầu GET đến server với searchTerm
    fetch(`/search-tasks?term=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(tasks => {
            // Hiển thị tasks tìm được
            displayTasksForDate(tasks);

            // Nếu có task, cập nhật lịch
            if (tasks.length > 0) {
                const firstTaskDate = new Date(tasks[0].CreateAt);
                updateCalendarToSpecificDate(firstTaskDate);
                // Cập nhật selectedDate và giao diện lịch
                selectedDate = formatDate(firstTaskDate);
                updateSelectedDay(selectedDate);
            }
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });
}
// cập nhật Date theo task tìm kiếm
function updateCalendarToSpecificDate(date) {
    // Cập nhật biến toàn cục currentDate, currentMonth và currentYear
    currentDate = date;
    currentMonth = date.getMonth();
    currentYear = date.getFullYear();

    // Gọi hàm updateCalendar để cập nhật giao diện lịch
    updateCalendar();
}

// Thêm hàm toggleTaskComplete để xử lý việc toggle trạng thái hoàn thành
function toggleTaskComplete(taskID) {
    // Gửi request POST đến server
    fetch('/toggle-complete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskID })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Đảo ngược trạng thái hoàn thành của task trong giao diện người dùng
            const taskElement = document.querySelector(`.task[data-task-id="${taskID}"]`);
            if (taskElement) {
                taskElement.classList.toggle('completed'); // Thêm hoặc bỏ class 'completed'
            }
        } else {
            alert("Failed to toggle task complete: " + data.message);
        }
    })
    .catch(error => {
        console.error('Error toggling task complete:', error);
    });
}

function fetchDeletedTasks() {
    fetch('/deleted-tasks')
        .then(response => response.json())
        .then(tasks => {
            const tableBody = document.getElementById('deletedTasksTable').querySelector('tbody');
            tableBody.innerHTML = ''; // Xóa các hàng hiện tại
            tasks.forEach(task => {
                const row = tableBody.insertRow();
                const taskNameCell = row.insertCell(0);
                const deletedAtCell = row.insertCell(1);
                taskNameCell.textContent = task.TaskName;
                deletedAtCell.textContent = new Date(task.CreateAt).toLocaleString();
            });
        })
        .catch(error => {
            console.error('Error fetching deleted tasks:', error);
        });
}

// DOM contentLoaded kích hoạt khi HTML đã tải xong
document.addEventListener('DOMContentLoaded', function () {
    selectedDate = formatDate(new Date());
    updateCalendar(); // cập nhật lịch dựa trên ngày hiện tại 
    fetchTasksForDate(selectedDate);
    fetchDeletedTasks(); // Lấy và hiển thị các công việc đã bị xóa

    document.getElementById('searchButton').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchInput').value; // Lấy giá trị nhập vào từ trường tìm kiếm
        searchTasks(searchTerm);
    });

    // Thêm sự kiện click cho nút Đăng xuất
    document.getElementById('logout').addEventListener('click', function(event) {
        event.preventDefault(); // Ngăn không cho trang chuyển hướng ngay lập tức

        // Gửi yêu cầu đăng xuất đến server
        fetch('/logout', {
            method: 'POST',
            // Các headers và body nếu cần
        })
        .then(() => {
            // Khi đăng xuất thành công, chuyển hướng người dùng đến trang login.html
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Thêm sự kiện nhấn phím Enter trong trường nhập công việc
    taskInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    // Thêm sự kiện click cho danh sách công việcs
    document.querySelector('#tasks').addEventListener('click', function(e) {
        // Kiểm tra xem click có phải từ nút xóa không
        if (e.target.closest('.delete')) {
            return; // Nếu là nút xóa thì không làm gì cả
        }
        // Nếu không, tìm taskElement gần nhất và toggle trạng thái hoàn thành của nó
        const taskElement = e.target.closest('.task');
        if (taskElement) {
            const taskID = taskElement.dataset.taskId;
            toggleTaskComplete(taskID);
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete') || e.target.closest('.delete')) {
            // Lấy taskID từ phần tử gần nhất với class 'task'
            const taskElement = e.target.closest('.task');
            const taskID = taskElement.dataset.taskId; // Sử dụng dataset để lấy taskID
            deleteTask(e, taskID);
        }
    });
});