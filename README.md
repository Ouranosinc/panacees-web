# PANACÉES

## Requirements

Recent version of node and npm. Run `npm ci` in the folder to install dependencies.

## Updating input data

Run `./prepare_data.sh` to process the data present in the `input_data` folder into ready-to-publish
data in the `public/data` folder. All input data must be UTF-8 format!

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


## Data conversion

If data is in wrong encoding: (E.g.)

`iconv -f iso-8859-1 -t utf-8 couts_adaptations.csv -o couts_adaptations_utf8.csv`


Ignore this:

```
npm run build && rsync --info=progress2 -rz --delete build/ root@165.227.42.230:/var/www/html/
```