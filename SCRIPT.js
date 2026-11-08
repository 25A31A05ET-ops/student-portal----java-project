var SPREADSHEET_ID = 'YOUR_STUDENT_SPREADSHEET_ID_HERE'; 
var PARENT_FOLDER_ID = 'YOUR_STUDENT_PARENT_FOLDER_ID_HERE';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Student Certificate Upload Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function processForm(formObject) {
  try {
    // --- Current Month Date Guardrail ---
    if (!formObject.date) {
      return "Error: Date is required.";
    }

    var selectedDate = new Date(formObject.date);
    var now = new Date();

    if (selectedDate.getFullYear() !== now.getFullYear() || selectedDate.getMonth() !== now.getMonth()) {
      return "Error: You can only upload achievements earned during the current month!";
    }
    // ------------------------------------

    var parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    
    // Auto-search or create subfolder matching Certificate Type
    var folderIterator = parentFolder.getFoldersByName(formObject.certType);
    var targetFolder;
    if (folderIterator.hasNext()) {
      targetFolder = folderIterator.next();
    } else {
      targetFolder = parentFolder.createFolder(formObject.certType);
    }
    
    var fileBlob = Utilities.newBlob(Utilities.base64Decode(formObject.fileData), formObject.fileMimeType, formObject.fileName);
    var extension = formObject.fileOriginalName.split('.').pop();
    
    // Save file named as RollNo.ext (e.g., 21A91A0501.pdf)
    var newFileName = formObject.rollNo + "." + extension;
    fileBlob.setName(newFileName);
    
    targetFolder.createFile(fileBlob);
    
    // Format date from yyyy-mm-dd to dd-mm-yyyy
    var formattedDate = "";
    var parts = formObject.date.split('-'); 
    if (parts.length === 3) {
      formattedDate = parts[2] + "-" + parts[1] + "-" + parts[0]; 
    } else {
      formattedDate = formObject.date;
    }

    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    var lastRow = sheet.getLastRow();
    var slNo = lastRow; 
    
    // Append entry to Sheet: SLNO, Roll No, Name, Year, Section, Certificate Type, Title, Authority, Date
    sheet.appendRow([
      slNo, 
      formObject.rollNo, 
      formObject.name, 
      formObject.year, 
      formObject.section, 
      formObject.certType, 
      formObject.title, 
      formObject.auth,
      formattedDate 
    ]);
    
    return "Success! Certificate uploaded successfully.";
    
  } catch (error) {
    return "Error: " + error.toString();
  }
}
