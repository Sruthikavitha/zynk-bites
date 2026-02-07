import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foodsDir = path.join(__dirname, '../../public/foods');

if (!fs.existsSync(foodsDir)) {
    fs.mkdirSync(foodsDir, { recursive: true });
}

const images = {
    "chicken-biryani.jpg": "https://www.chefkunalkapur.com/wp-content/uploads/2021/02/0L5A2961-scaled.jpg",
    "veg-biryani.jpg": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop",
    "tomato-rice.jpg": "https://img.youtube.com/vi/X_Vn1tI3ojM/maxresdefault.jpg",
    "curd-rice.jpg": "https://images.unsplash.com/photo-1604908176997-4314de63b5f3?q=80&w=1000&auto=format&fit=crop",
    "fried-rice.jpg": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1000&auto=format&fit=crop",
    "meals.jpg": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1000&auto=format&fit=crop",
    "chapati.jpg": "https://images.unsplash.com/photo-1505253716362-af10dd297dd5?q=80&w=1000&auto=format&fit=crop", // Authentic Roti
    "naan.jpg": "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=1000&auto=format&fit=crop", // Authentic Naan
    "butter-chicken.jpg": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1000&auto=format&fit=crop",
    "paneer-butter-masala.jpg": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1000&auto=format&fit=crop",
    "dosa.jpg": "https://images.unsplash.com/photo-1668236543090-d23ad8411643?q=80&w=1000&auto=format&fit=crop", // Authentic Dosa
    "idli.jpg": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1000&auto=format&fit=crop",
    "poori.jpg": "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?q=80&w=1000&auto=format&fit=crop",
    "curry.jpg": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop",
    "grilled-chicken.jpg": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?q=80&w=1000&auto=format&fit=crop"
};

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlink(filepath, () => { }); // Delete partial file
                reject(`Server responded with ${response.statusCode}: ${url}`);
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete partial file
            reject(err.message);
        });
    });
};

async function downloadAll() {
    console.log('Starting download...');
    for (const [filename, url] of Object.entries(images)) {
        const filepath = path.join(foodsDir, filename);
        try {
            console.log(`Downloading ${filename}...`);
            await downloadImage(url, filepath);
            console.log(`Successfully downloaded ${filename}`);
        } catch (error) {
            console.error(`Failed to download ${filename}:`, error);
        }
    }
    console.log('All downloads completed.');
}

downloadAll();
