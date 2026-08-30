# School Global Details API Documentation

This document contains the cURL commands to test the **School Global Details** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New School
**POST** `/api/school-global-details`

```bash
curl -X POST http://localhost:5000/api/school-global-details \
-H "Content-Type: application/json" \
-d '{
  "schoolName": "Navals National Academy",
  "schoolAddress": "123 Education Lane",
  "schoolAddress2": "Sector 5",
  "schoolShortName": "NNA",
  "contactNo": "0123-456789",
  "mobile": "9876543210",
  "secondaryContactNo": "9876543211",
  "emailId": "navalsnationalacademymau@gmail.com",
  "supportEmailId": "support@navals.com",
  "website": "www.navalsnationalacademydohrighat.com",
  "prefix": "NNA",
  "isoDetails": "ISO 9001:2015",
  "establishmentCode": "EST-1990",
  "schoolNo": "SCH-001",
  "affiliationTo": "CBSE",
  "affiliationNo": "AFF-54321",
  "associates": "Navals Group",
  "renewUpto": "2030-03-31",
  "schoolStatus": "Active",
  "city": "Dohrighat",
  "eCareMobileNo": "9876543212",
  "workingDays": "220",
  "recess": "45 mins",
  "totalPeriod": "8",
  "schoolCategory": "Co-Ed",
  "uDiseRegistrationNo": "UDISE-998877",
  "facebookId": "navals.academy",
  "supportTime": "9:00AM - 6:00PM",
  "supportDays": "Mon-Sat",
  "isMainSchool": true
}'
```

## 2. Get All Schools
**GET** `/api/school-global-details`

```bash
curl -X GET http://localhost:5000/api/school-global-details
```

## 3. Get School by ID
**GET** `/api/school-global-details/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/school-global-details/6a8e75341f1655010e58d235
```

## 4. Update School
**PUT** `/api/school-global-details/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/school-global-details/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "city": "Mau",
  "schoolStatus": "Inactive"
}'
```

## 5. Delete School
**DELETE** `/api/school-global-details/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/school-global-details/6a8e75341f1655010e58d235
```

---

# Define School Board API Documentation

This document contains the cURL commands to test the **School Board** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New School Board
**POST** `/api/school-boards`

```bash
curl -X POST http://localhost:5000/api/school-boards \
-H "Content-Type: application/json" \
-d '{
  "boardName": "CBSE",
  "isDefault": true
}'
```

## 2. Get All School Boards
**GET** `/api/school-boards`

```bash
curl -X GET http://localhost:5000/api/school-boards
```

## 3. Get School Board by ID
**GET** `/api/school-boards/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/school-boards/6a8e75341f1655010e58d235
```

## 4. Update School Board
**PUT** `/api/school-boards/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/school-boards/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "boardName": "ICSE",
  "isDefault": false
}'
```

## 5. Delete School Board
**DELETE** `/api/school-boards/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/school-boards/6a8e75341f1655010e58d235
```


---

# School Global Details With FeeType API Documentation

This document contains the cURL commands to test the **School Global Details With FeeType** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New School (With FeeType)
**POST** `/api/school-global-fee-types`

```bash
curl -X POST http://localhost:5000/api/school-global-fee-types \
-H "Content-Type: application/json" \
-d '{
  "feeType": "School Fee",
  "schoolName": "Navals National Academy",
  "schoolAddress": "123 Education Lane",
  "schoolAddress2": "Sector 5",
  "schoolShortName": "NNA",
  "contactNo": "0123-456789",
  "mobile": "9876543210",
  "email": "navalsnationalacademymau@gmail.com",
  "supportEmailId": "support@navals.com",
  "website": "www.navalsnationalacademydohrighat.com",
  "prefix": "NNA",
  "receiptSettings": "Default Receipt",
  "schoolNo": "SCH-001",
  "affiliationTo": "CBSE",
  "affiliationNo": "AFF-54321",
  "associates": "Navals Group",
  "renewUpto": "2030-03-31",
  "schoolStatus": "Active",
  "city": "Dohrighat",
  "eCareMobileNo": "9876543212",
  "workingDays": "220",
  "recess": "45 mins",
  "totalPeriod": "8",
  "isAdmin": false
}'
```

## 2. Get All Schools
**GET** `/api/school-global-fee-types`

```bash
curl -X GET http://localhost:5000/api/school-global-fee-types
```

## 3. Get School by ID
**GET** `/api/school-global-fee-types/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/school-global-fee-types/6a8e75341f1655010e58d235
```

## 4. Update School
**PUT** `/api/school-global-fee-types/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/school-global-fee-types/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "city": "Mau",
  "schoolStatus": "Inactive"
}'
```

## 5. Delete School
**DELETE** `/api/school-global-fee-types/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/school-global-fee-types/6a8e75341f1655010e58d235
```


---

# Define Wing API Documentation

This document contains the cURL commands to test the **Wing** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New Wing
**POST** `/api/wings`

```bash
curl -X POST http://localhost:5000/api/wings \
-H "Content-Type: application/json" \
-d '{
  "wingName": "Kindergarten"
}'
```

## 2. Get All Wings
**GET** `/api/wings`

```bash
curl -X GET http://localhost:5000/api/wings
```

## 3. Get Wing by ID
**GET** `/api/wings/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/wings/6a8e75341f1655010e58d235
```

## 4. Update Wing
**PUT** `/api/wings/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/wings/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "wingName": "Primary"
}'
```

## 5. Delete Wing
**DELETE** `/api/wings/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/wings/6a8e75341f1655010e58d235
```


---

# Define Class API Documentation

This document contains the cURL commands to test the **School Class** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New Class
**POST** `/api/school-classes`

```bash
curl -X POST http://localhost:5000/api/school-classes \
-H "Content-Type: application/json" \
-d '{
  "className": "NUR",
  "wingName": "Kindergarten",
  "schoolName": "NAVALS NATIONAL ACADEMY",
  "orderNo": 1
}'
```

## 2. Get All Classes
**GET** `/api/school-classes`

```bash
curl -X GET http://localhost:5000/api/school-classes
```

## 3. Get Class by ID
**GET** `/api/school-classes/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/school-classes/6a8e75341f1655010e58d235
```

## 4. Update Class
**PUT** `/api/school-classes/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/school-classes/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "className": "LKG",
  "orderNo": 2
}'
```

## 5. Delete Class
**DELETE** `/api/school-classes/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/school-classes/6a8e75341f1655010e58d235
```


---

# Define Section API Documentation

This document contains the cURL commands to test the **Section** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New Section
**POST** `/api/sections`

```bash
curl -X POST http://localhost:5000/api/sections \
-H "Content-Type: application/json" \
-d '{
  "sectionName": "A",
  "orderNo": 1
}'
```

## 2. Get All Sections
**GET** `/api/sections`

```bash
curl -X GET http://localhost:5000/api/sections
```

## 3. Get Section by ID
**GET** `/api/sections/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/sections/6a8e75341f1655010e58d235
```

## 4. Update Section
**PUT** `/api/sections/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/sections/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "sectionName": "B",
  "orderNo": 2
}'
```

## 5. Delete Section
**DELETE** `/api/sections/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/sections/6a8e75341f1655010e58d235
```


---

# Relate Class Section API Documentation

This document contains the cURL commands to test the **Relate Class Section** APIs.
The base URL is `http://localhost:5000`.

## 1. Relate Sections to a Class
**POST** `/api/class-sections`
*(This endpoint creates a new relation or updates an existing one for the given class)*

```bash
curl -X POST http://localhost:5000/api/class-sections \
-H "Content-Type: application/json" \
-d '{
  "className": "NUR",
  "sections": ["A", "B", "C"]
}'
```

## 2. Get All Class Section Relations
**GET** `/api/class-sections`

```bash
curl -X GET http://localhost:5000/api/class-sections
```

## 3. Get Sections related to a specific Class
**GET** `/api/class-sections/:className`

*(Replace `:className` with the actual class name, e.g., NUR)*
```bash
curl -X GET http://localhost:5000/api/class-sections/NUR
```

## 4. Delete a Class Section Relation
**DELETE** `/api/class-sections/:id`

*(Replace `:id` with the actual ObjectId from the database)*
```bash
curl -X DELETE http://localhost:5000/api/class-sections/6a8e75341f1655010e58d235
```


---

# Define Religion API Documentation

This document contains the cURL commands to test the **Religion** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New Religion
**POST** `/api/religions`

```bash
curl -X POST http://localhost:5000/api/religions \
-H "Content-Type: application/json" \
-d '{
  "religionName": "HINDU"
}'
```

## 2. Get All Religions
**GET** `/api/religions`

```bash
curl -X GET http://localhost:5000/api/religions
```

## 3. Get Religion by ID
**GET** `/api/religions/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/religions/6a8e75341f1655010e58d235
```

## 4. Update Religion
**PUT** `/api/religions/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/religions/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "religionName": "MUSLIM"
}'
```

## 5. Delete Religion
**DELETE** `/api/religions/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/religions/6a8e75341f1655010e58d235
```


---

# Define Committee API Documentation

This document contains the cURL commands to test the **Committee** APIs.
The base URL is `http://localhost:5000`.

## 1. Create a New Committee Member
**POST** `/api/committees`

```bash
curl -X POST http://localhost:5000/api/committees \
-H "Content-Type: application/json" \
-d '{
  "committeeType": "Disciplinary",
  "designation": "Head",
  "roleType": "Employee",
  "activeStatus": true,
  "memberName": "John Doe",
  "fromDate": "2026-08-26",
  "toDate": "2027-08-26"
}'
```

## 2. Get All Committee Members
**GET** `/api/committees`

```bash
curl -X GET http://localhost:5000/api/committees
```

## 3. Get Committee Member by ID
**GET** `/api/committees/:id`

*(Replace `:id` with an actual ID from the Get All request)*
```bash
curl -X GET http://localhost:5000/api/committees/6a8e75341f1655010e58d235
```

## 4. Update Committee Member
**PUT** `/api/committees/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X PUT http://localhost:5000/api/committees/6a8e75341f1655010e58d235 \
-H "Content-Type: application/json" \
-d '{
  "activeStatus": false,
  "designation": "Member"
}'
```

## 5. Delete Committee Member
**DELETE** `/api/committees/:id`

*(Replace `:id` with an actual ID)*
```bash
curl -X DELETE http://localhost:5000/api/committees/6a8e75341f1655010e58d235
```

