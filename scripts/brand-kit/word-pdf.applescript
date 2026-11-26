-- Exports one Word document, already open, to PDF, then closes only that document.
--
--   osascript word-pdf.applescript "<document name>" "<pdf path inside Word's container>"
--
-- Called by preview.ts. `exists document` answers «missing value» in Word for
-- Mac 16.115, so the document is looked for by name instead.

on isOpen(docName)
	tell application "Microsoft Word"
		try
			set openNames to name of every document
		on error
			return false
		end try
	end tell
	repeat with openName in openNames
		if (openName as text) is docName then return true
	end repeat
	return false
end isOpen

on run argv
	set docName to item 1 of argv
	set outPosix to item 2 of argv
	set outHfs to (POSIX file outPosix) as text
	set found to false
	repeat 80 times
		if isOpen(docName) then
			set found to true
			exit repeat
		end if
		delay 0.5
	end repeat
	if not found then error "document did not open: " & docName
	delay 1
	tell application "Microsoft Word"
		save as document docName file name outHfs file format format PDF
	end tell
	delay 0.5
	if isOpen(docName) then
		tell application "Microsoft Word" to close document docName saving no
		return "closed " & docName
	end if
	return "exported; document name changed"
end run
