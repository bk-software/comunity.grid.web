# Community Card Balance Checker - Web App

A client-side web application for checking community card balances via barcode lookup. This app uses Firebase Firestore for read-only access to card data and provides barcode scanning capabilities.

## Features

- **Barcode Input**: Manual entry with automatic validation and formatting
- **Camera Scanner**: Real-time barcode scanning using device camera
- **Firebase Integration**: Secure read-only access to Firestore database
- **Multi-Environment Support**: Easy switching between dev/integration/production
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Validation**: Instant feedback on barcode format
- **Balance Display**: Shows available balance and monthly budget

## Project Structure

```
web_app/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All CSS styles and responsive design
├── js/
│   ├── config.js           # Environment configuration and settings
│   ├── firebase-service.js # Firebase integration and card lookup logic
│   ├── scanner.js          # Barcode scanner functionality
│   └── app.js              # Main application logic and UI management
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Modern web browser with camera access for scanning
- Internet connection for Firebase access
- HTTPS hosting (required for camera access in production)

### Setup

1. **Firebase Configuration**:
   - **Enable Anonymous Authentication** in Firebase Console:
     - Go to Firebase Console → Authentication → Sign-in method
     - Enable "Anonymous" provider
     - This is required for read-only access to Firestore

   - **Configure Environment**:
     - Open `js/config.js`
     - Set `CURRENT_ENV` to desired environment (`dev`, `integration`, or `prod`)
     - Update Firebase configuration values for integration/production environments

2. **Host the Application**:
   - For development: Use any local web server (e.g., `python -m http.server`)
   - For production: Deploy to HTTPS hosting (required for camera access)

3. **Access the App**:
   - Open `index.html` in a web browser
   - Allow camera permissions when prompted for scanning

## Configuration

### Environment Switching

Edit `js/config.js` to switch between environments:

```javascript
const CONFIG = {
    CURRENT_ENV: 'dev', // Change to 'integration' or 'prod'
    // ...
};
```

### Firebase Configuration

Update the Firebase configuration for each environment in `js/config.js`:

```javascript
FIREBASE_CONFIGS: {
    dev: {
        apiKey: "your-dev-api-key",
        authDomain: "community-card-dev.firebaseapp.com",
        projectId: "community-card-dev",
        // ...
    },
    // Add integration and prod configs
}
```

## Usage

### Manual Barcode Entry

1. Enter a 16-digit barcode in the input field
2. Click "Check Balance" or press Enter
3. View the card balance and monthly budget

### Barcode Scanning

1. Click the camera icon or "Scan Barcode" button
2. Allow camera permissions when prompted
3. Point the camera at a barcode
4. The app will automatically detect and process the barcode

### Keyboard Shortcuts

- **Enter**: Check balance (when input is focused)
- **Ctrl/Cmd + S**: Open barcode scanner
- **Escape**: Close scanner modal

## Firebase Security

The app uses read-only access to Firebase Firestore with the following security model:

- **No Authentication Required**: Public access for card balance checking
- **Read-Only Operations**: Only queries existing data, never writes
- **Collection Group Queries**: Searches across all communities for barcodes
- **Data Validation**: Client-side validation prevents invalid queries

### Firestore Collections Used

- `communities/{communityId}/cards/{cardId}` - Card data and status
- `communities/{communityId}/cards/{cardId}/allocations/{yyyymm}` - Monthly allocations

## Technical Details

### Dependencies

- **Firebase SDK v9**: For Firestore database access
- **QuaggaJS**: For barcode scanning functionality
- **Material Icons**: For UI icons
- **Inter Font**: For typography

### Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Camera Access**: HTTPS required for production scanning
- **Mobile Support**: Optimized for iOS Safari and Android Chrome

### Performance Features

- **Lazy Loading**: Scanner only initializes when needed
- **Automatic Cleanup**: Resources are properly released
- **Responsive Design**: Optimized for all screen sizes
- **Caching**: Firebase SDK caching for better performance

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions" Error**:
   - **Solution**: Enable Anonymous Authentication in Firebase Console
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable the "Anonymous" provider
   - This allows the web app to authenticate and read card data

2. **Camera Not Working**:
   - Ensure HTTPS is used (required for camera access)
   - Check browser permissions for camera
   - Try refreshing the page

3. **Firebase Connection Errors**:
   - Verify network connection
   - Check Firebase configuration in `config.js`
   - Ensure Firestore rules allow read access for authenticated users

4. **Barcode Not Scanning**:
   - Ensure good lighting
   - Hold steady and position barcode clearly in frame
   - Try manual entry if scanning fails

### Debug Mode

Enable debug logging by setting `DEBUG: true` in `js/config.js`. This will log detailed information to the browser console.

## Security Considerations

- **Client-Side Only**: No server-side components or secrets
- **Read-Only Access**: Cannot modify any data
- **Public Information**: Only displays publicly accessible card balances
- **Input Validation**: Prevents malformed queries
- **Environment Separation**: Clear separation between dev/integration/prod

## Future Enhancements

- **PWA Support**: Service worker for offline capability
- **Multiple Barcode Formats**: Support for different barcode types
- **History**: Local storage of recent lookups
- **Analytics**: Usage tracking and performance monitoring
- **Multi-Language**: Internationalization support

## Development

### Local Development

1. Clone the repository
2. Navigate to the `web_app` directory
3. Start a local web server: `python -m http.server 8000`
4. Open `http://localhost:8000` in your browser

### Testing

Test with the development Firebase environment using known barcode values. The app includes debug logging to help troubleshoot issues.

### Deployment

1. Update Firebase configuration for target environment
2. Deploy to HTTPS hosting provider
3. Test camera functionality in production environment
4. Verify Firebase connectivity and permissions

## License

This web app is part of the Community Card project and follows the same licensing terms.