# Win32 API

This document describes the JavaScript interface available to third-party programs running inside win32.run.

## pick_files
Let users pick files through the win32.run file picker.

**Parameters**
- `desc`: description of the desired files.
- `exts`: array of acceptable file extensions.
- `multiple`: allow selecting multiple files (default: `true`).

**Returns**
- `Promise<Array<Object>>` resolving to an array of win32 file objects.

## save_file
Save content to an existing win32 file without showing the save dialog.

**Parameters**
- `file`: [File](https://developer.mozilla.org/en-US/docs/Web/API/File) object.
- `id`: win32 file identifier.

**Returns**
- `Promise<void>`

## save_file_as
Open the save dialog to create or overwrite a file on win32.run.

**Parameters**
- `file`: [File](https://developer.mozilla.org/en-US/docs/Web/API/File) object.
- `types`: array of `{ desc, mime, ext }` describing acceptable formats.

**Returns**
- `Promise<string>` resolving to the id of the saved file.

## get_file
Retrieve a file by its identifier.

**Parameters**
- `id`: win32 file identifier.

**Returns**
- `Promise<Object>` resolving to a win32 file object.
