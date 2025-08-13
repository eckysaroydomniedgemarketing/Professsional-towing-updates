# Update Poster Configuration

## Essential Configuration Values

### URLs
```javascript
urls: {
  threeDay: 'https://app.recoverydatabase.net/mod02_SA/three_day_updates.php?num_of_days=3&agent=&case_worker=&investigator=&ctnames=&include_skips=Yes&level_limit=0&exclude_today=Yes&submit=Update'
}
```

### Timeouts (in milliseconds)
```javascript
timeouts: {
  element: 60000,      // 1 minute for element operations
  shortBreak: 2000     // 2 seconds for short waits
}
```

### Wait States
```javascript
waitUntil: {
  default: 'domcontentloaded'  // Wait for DOM to be ready
}
```

## Essential CSS Selectors

### Update Form Selectors
```javascript
// Address dropdown for selecting which address the update is for
addressDropdown: 'select#is_address_update_select'

// Textarea where update message is typed
updateTextArea: 'textarea#comments'

// Button to submit the update
createUpdateButton: 'button#create_button'

// Link to show all updates
allUpdatesLink: 'a[href="#"][data-page="ALL"], a[data-page="ALL"], .page-link[data-page="ALL"]'

// Updates tab selector
updatesTab: '.nav-item a span.js-label:text-is("Updates"), .nav-item#tab_6 a, li.nav-item#tab_6 a.nav-link, a[onclick*="switchTab(6)"], #tab_6 a, .nav-link[href*="tab=6"]'
```

## Usage Notes

These configuration values are used by UpdatePoster.js for:
- Finding the form elements on the page
- Setting appropriate timeouts for operations
- Determining how long to wait for page loads

The selectors must match the actual HTML elements on the target website for the update posting to work correctly.