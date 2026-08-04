# -*- coding: utf-8 -*-
"""
AI MetroFlow - Station Master Data source of truth.

Station names and line assignments are REAL (compiled from public metro network
maps). Latitude/longitude are approximated by interpolating each station along its
line's real terminal-to-terminal corridor (real endpoint coordinates) with small
deterministic jitter, so stations are geographically ordered and city-plausible.

Each metro line is defined compactly as:
    line_name -> {
        endpoints: [(lat_start, lon_start), (lat_end, lon_end)],
        opening_year: int,
        stations: [ordered list of real station names, terminal to terminal],
        default_city, default_state,
        city_map: {station_name: city}   # for lines crossing city borders (NCR etc.)
    }
"""

# ----------------------------------------------------------------------------
# Real interchange stations (multi-line junctions) across networks
# ----------------------------------------------------------------------------
INTERCHANGES = {
    # Delhi
    "Rajiv Chowk", "Kashmere Gate", "Central Secretariat", "Mandi House",
    "Inderlok", "Kirti Nagar", "Botanical Garden", "Hauz Khas", "INA",
    "Yamuna Bank", "Ashok Park Main", "Netaji Subhash Place", "Azadpur",
    "Welcome", "Anand Vihar ISBT", "Karol Bagh", "Lajpat Nagar",
    "Mayur Vihar Phase-1", "Dwarka Sector 21", "New Delhi", "Sikanderpur",
    "MG Road", "Janakpuri West", "Dhaula Kuan", "Durgabai Deshmukh South Campus",
    "Sarai Kale Khan Nizamuddin",
    # Mumbai
    "Ghatkopar", "Andheri", "Marol Naka", "Dahisar East", "Gundavali",
    # Bengaluru
    "Majestic", "Kempegowda", "Nadaprabhu Kempegowda Station Majestic",
    # Hyderabad
    "Ameerpet", "MG Bus Station", "Parade Ground",
    # Chennai
    "Alandur", "Chennai Central", "St. Thomas Mount",
    # Kolkata
    "Esplanade", "Sealdah",
    # Ahmedabad
    "Ranip",
    # Nagpur
    "Munje Chowk", "Sitabuldi",
    # Pune
    "Civil Court", "Pune",
    # Jaipur
    "Badi Chaupar",
}

# Airports / railway junctions / notable category overrides
CATEGORY_OVERRIDE = {
    "IGI Airport": "Airport", "Airport": "Airport",
    "Chhatrapati Shivaji International Airport": "Airport",
    "Kempegowda International Airport": "Airport",
    "RGI Airport": "Airport", "Rajiv Gandhi International Airport": "Airport",
    "New Delhi": "Railway Connection", "Chennai Central": "Railway Connection",
    "Chennai Central Metro": "Railway Connection", "Sealdah": "Railway Connection",
    "Kashmere Gate": "Railway Connection", "Anand Vihar ISBT": "Railway Connection",
    "Sarai Kale Khan Nizamuddin": "Railway Connection", "Majestic": "Railway Connection",
    "Kacheguda": "Railway Connection", "Pune": "Railway Connection",
    "Kanpur Central": "Railway Connection", "Charbagh": "Railway Connection",
    "Cyber City": "IT Hub", "Cyber Hub": "IT Hub", "HITEC City": "IT Hub",
    "Raidurg": "IT Hub", "Durgam Cheruvu": "IT Hub", "Electronic City": "IT Hub",
    "Whitefield (Kadugodi)": "IT Hub", "Gachibowli": "IT Hub",
    "SEEPZ": "IT Hub", "Marol Naka": "IT Hub",
    "Huda City Centre": "Commercial", "Rajiv Chowk": "Commercial",
    "MG Road": "Commercial", "Ameerpet": "Commercial", "Sitabuldi": "Commercial",
    "IIT Delhi": "Educational Zone", "IIT Kanpur": "Educational Zone",
    "Vishwavidyalaya": "Educational Zone", "GTB Nagar": "Educational Zone",
}

# ----------------------------------------------------------------------------
# Metro line corridor definitions
# ----------------------------------------------------------------------------
METROS = {}

# ============================ DELHI METRO (DMRC) =============================
METROS["Delhi Metro"] = {
    "state": "Delhi NCR",
    "lines": {
        "Yellow Line": {
            "endpoints": [(28.7466, 77.1379), (28.4595, 77.0724)],
            "opening_year": 2004, "default_city": "Delhi",
            "stations": [
                "Samaypur Badli", "Rohini Sector 18-19", "Haiderpur Badli Mor",
                "Jahangirpuri", "Adarsh Nagar", "Azadpur", "Model Town", "GTB Nagar",
                "Vishwavidyalaya", "Vidhan Sabha", "Civil Lines", "Kashmere Gate",
                "Chandni Chowk", "Chawri Bazar", "New Delhi", "Rajiv Chowk",
                "Patel Chowk", "Central Secretariat", "Udyog Bhawan", "Lok Kalyan Marg",
                "Jor Bagh", "INA", "AIIMS", "Green Park", "Hauz Khas", "Malviya Nagar",
                "Saket", "Qutab Minar", "Chhatarpur", "Sultanpur", "Ghitorni",
                "Arjan Garh", "Guru Dronacharya", "Sikanderpur", "MG Road",
                "IFFCO Chowk", "Huda City Centre",
            ],
            "city_map": {
                "Arjan Garh": "Gurugram", "Guru Dronacharya": "Gurugram",
                "Sikanderpur": "Gurugram", "MG Road": "Gurugram",
                "IFFCO Chowk": "Gurugram", "Huda City Centre": "Gurugram",
            },
        },
        "Blue Line": {
            "endpoints": [(28.5924, 77.0459), (28.5926, 77.3730)],
            "opening_year": 2005, "default_city": "Delhi",
            "stations": [
                "Dwarka Sector 21", "Dwarka Sector 8", "Dwarka Sector 9",
                "Dwarka Sector 10", "Dwarka Sector 11", "Dwarka Sector 12",
                "Dwarka Sector 13", "Dwarka Sector 14", "Dwarka", "Dwarka Mor",
                "Nawada", "Uttam Nagar West", "Uttam Nagar East", "Janakpuri West",
                "Janakpuri East", "Tilak Nagar", "Subhash Nagar", "Tagore Garden",
                "Rajouri Garden", "Ramesh Nagar", "Moti Nagar", "Kirti Nagar",
                "Shadipur", "Patel Nagar", "Rajendra Place", "Karol Bagh",
                "Jhandewalan", "RK Ashram Marg", "Rajiv Chowk", "Barakhamba Road",
                "Mandi House", "Supreme Court", "Indraprastha", "Yamuna Bank",
                "Akshardham", "Mayur Vihar Phase-1", "Mayur Vihar Extension",
                "New Ashok Nagar", "Noida Sector 15", "Noida Sector 16",
                "Noida Sector 18", "Botanical Garden", "Golf Course",
                "Noida City Centre", "Noida Sector 34", "Noida Sector 52",
                "Noida Sector 61", "Noida Sector 59", "Noida Sector 62",
                "Noida Electronic City",
            ],
            "city_map": {k: "Noida" for k in [
                "Noida Sector 15", "Noida Sector 16", "Noida Sector 18",
                "Botanical Garden", "Golf Course", "Noida City Centre",
                "Noida Sector 34", "Noida Sector 52", "Noida Sector 61",
                "Noida Sector 59", "Noida Sector 62", "Noida Electronic City"]},
        },
        "Red Line": {
            "endpoints": [(28.7206, 77.1069), (28.6820, 77.4530)],
            "opening_year": 2002, "default_city": "Delhi",
            "stations": [
                "Rithala", "Rohini West", "Rohini East", "Pitampura",
                "Kohat Enclave", "Netaji Subhash Place", "Keshav Puram",
                "Kanhaiya Nagar", "Inderlok", "Shastri Nagar", "Pratap Nagar",
                "Pulbangash", "Tis Hazari", "Kashmere Gate", "Shastri Park",
                "Seelampur", "Welcome", "Shahdara", "Mansarovar Park", "Jhilmil",
                "Dilshad Garden", "Shaheed Nagar", "Raj Bagh", "Major Mohit Sharma",
                "Shyam Park", "Mohan Nagar", "Arthala", "Hindon River",
                "Shaheed Sthal",
            ],
            "city_map": {k: "Ghaziabad" for k in [
                "Shaheed Nagar", "Raj Bagh", "Major Mohit Sharma", "Shyam Park",
                "Mohan Nagar", "Arthala", "Hindon River", "Shaheed Sthal"]},
        },
        "Violet Line": {
            "endpoints": [(28.6675, 77.2281), (28.3339, 77.3216)],
            "opening_year": 2010, "default_city": "Delhi",
            "stations": [
                "Kashmere Gate", "Lal Qila", "Jama Masjid", "Delhi Gate",
                "ITO", "Mandi House", "Janpath", "Central Secretariat",
                "Khan Market", "Jawaharlal Nehru Stadium", "Jangpura",
                "Lajpat Nagar", "Moolchand", "Kailash Colony", "Nehru Place",
                "Kalkaji Mandir", "Govind Puri", "Harkesh Nagar Okhla",
                "Jasola Apollo", "Sarita Vihar", "Mohan Estate", "Tughlakabad",
                "Badarpur Border", "Sarai", "NHPC Chowk", "Mewala Maharajpur",
                "Sector 28 Faridabad", "Badkal Mor", "Old Faridabad",
                "Neelam Chowk Ajronda", "Bata Chowk", "Escorts Mujesar",
                "Sant Surdas Sihi", "Raja Nahar Singh Ballabgarh",
            ],
            "city_map": {k: "Faridabad" for k in [
                "Sarai", "NHPC Chowk", "Mewala Maharajpur", "Sector 28 Faridabad",
                "Badkal Mor", "Old Faridabad", "Neelam Chowk Ajronda", "Bata Chowk",
                "Escorts Mujesar", "Sant Surdas Sihi", "Raja Nahar Singh Ballabgarh"]},
        },
        "Magenta Line": {
            "endpoints": [(28.6289, 77.0783), (28.5644, 77.3340)],
            "opening_year": 2017, "default_city": "Delhi",
            "stations": [
                "Janakpuri West", "Dabri Mor Janakpuri South", "Dashrath Puri",
                "Palam", "Sadar Bazar Cantonment", "Terminal 1 IGI Airport",
                "Shankar Vihar", "Vasant Vihar", "Munirka", "RK Puram",
                "IIT Delhi", "Hauz Khas", "Panchsheel Park", "Chirag Delhi",
                "Greater Kailash", "Nehru Enclave", "Kalkaji Mandir", "Okhla NSIC",
                "Sukhdev Vihar", "Jamia Millia Islamia", "Okhla Vihar",
                "Jasola Vihar Shaheen Bagh", "Kalindi Kunj", "Okhla Bird Sanctuary",
                "Botanical Garden",
            ],
            "city_map": {"Botanical Garden": "Noida"},
        },
        "Pink Line": {
            "endpoints": [(28.7250, 77.1610), (28.6900, 77.3200)],
            "opening_year": 2018, "default_city": "Delhi",
            "stations": [
                "Majlis Park", "Azadpur", "Shalimar Bagh", "Netaji Subhash Place",
                "Shakurpur", "Punjabi Bagh West", "ESI Basaidarapur",
                "Rajouri Garden", "Mayapuri", "Naraina Vihar", "Delhi Cantt",
                "Durgabai Deshmukh South Campus", "Sir Vishweshwaraiah Moti Bagh",
                "Bhikaji Cama Place", "Sarojini Nagar", "INA", "South Extension",
                "Lajpat Nagar", "Vinobapuri", "Ashram", "Sarai Kale Khan Nizamuddin",
                "Mayur Vihar Phase-1", "Mayur Vihar Pocket-1", "Trilokpuri Sanjay Lake",
                "East Vinod Nagar", "Mandawali West Vinod Nagar", "IP Extension",
                "Anand Vihar ISBT", "Karkarduma", "Karkarduma Court", "Krishna Nagar",
                "East Azad Nagar", "Welcome", "Jaffrabad", "Maujpur Babarpur",
                "Gokulpuri", "Johri Enclave", "Shiv Vihar",
            ],
            "city_map": {},
        },
        "Green Line": {
            "endpoints": [(28.6725, 77.1520), (28.6215, 76.9760)],
            "opening_year": 2010, "default_city": "Delhi",
            "stations": [
                "Inderlok", "Ashok Park Main", "Punjabi Bagh", "Shivaji Park",
                "Madipur", "Paschim Vihar East", "Paschim Vihar West", "Peeragarhi",
                "Udyog Nagar", "Maharaja Surajmal Stadium", "Nangloi",
                "Nangloi Railway Station", "Rajdhani Park", "Mundka",
                "Mundka Industrial Area", "Ghevra", "Tikri Kalan", "Tikri Border",
                "Pandit Shree Ram Sharma", "Bahadurgarh City",
                "Brigadier Hoshiar Singh",
            ],
            "city_map": {k: "Bahadurgarh" for k in [
                "Pandit Shree Ram Sharma", "Bahadurgarh City", "Brigadier Hoshiar Singh"]},
        },
        "Airport Express": {
            "endpoints": [(28.6425, 77.2205), (28.5060, 77.0865)],
            "opening_year": 2011, "default_city": "Delhi",
            "stations": [
                "New Delhi", "Shivaji Stadium", "Dhaula Kuan",
                "Delhi Aerocity", "IGI Airport", "Dwarka Sector 21", "Yashobhoomi Dwarka Sector 25",
            ],
            "city_map": {},
        },
    },
}

# ======================= NOIDA METRO (Aqua Line, NMRC) ======================
METROS["Noida Metro"] = {
    "state": "Uttar Pradesh",
    "lines": {
        "Aqua Line": {
            "endpoints": [(28.5760, 77.3390), (28.4530, 77.5040)],
            "opening_year": 2019, "default_city": "Noida",
            "stations": [
                "Noida Sector 51", "Noida Sector 50", "Noida Sector 76",
                "Noida Sector 101", "Noida Sector 81", "NSEZ Noida Sector 83",
                "Noida Sector 137", "Noida Sector 142", "Noida Sector 143",
                "Noida Sector 144", "Noida Sector 145", "Noida Sector 146",
                "Noida Sector 147", "Noida Sector 148", "Knowledge Park II",
                "Pari Chowk", "Alpha 1", "Delta 1", "GNIDA Office", "Depot Station",
            ],
            "city_map": {k: "Greater Noida" for k in [
                "Knowledge Park II", "Pari Chowk", "Alpha 1", "Delta 1",
                "GNIDA Office", "Depot Station"]},
        },
    },
}

# ============================== MUMBAI METRO ================================
METROS["Mumbai Metro"] = {
    "state": "Maharashtra",
    "lines": {
        "Line 1 (Blue)": {
            "endpoints": [(19.1005, 72.8265), (19.0790, 72.9370)],
            "opening_year": 2014, "default_city": "Mumbai",
            "stations": [
                "Versova", "D.N. Nagar", "Azad Nagar", "Andheri",
                "Western Express Highway", "Chakala (J.B. Nagar)",
                "Airport Road", "Marol Naka", "Saki Naka", "Asalpha",
                "Jagruti Nagar", "Ghatkopar",
            ], "city_map": {},
        },
        "Line 2A (Yellow)": {
            "endpoints": [(19.2530, 72.8590), (19.1250, 72.8460)],
            "opening_year": 2022, "default_city": "Mumbai",
            "stations": [
                "Dahisar East", "Anand Nagar", "Kandarpada", "Mandapeshwar",
                "Eksar", "Borivali West", "Shimpoli", "Kandivali West",
                "Dahanukarwadi", "Valnai", "Malad West", "Lower Malad",
                "Bangur Nagar", "Goregaon West", "Oshiwara", "Lower Oshiwara",
                "D.N. Nagar",
            ], "city_map": {},
        },
        "Line 7 (Red)": {
            "endpoints": [(19.2540, 72.8690), (19.1180, 72.8630)],
            "opening_year": 2022, "default_city": "Mumbai",
            "stations": [
                "Dahisar East", "Ovaripada", "Rashtriya Udyan", "Devipada",
                "Magathane", "Poisar", "Akurli", "Kurar", "Dindoshi",
                "Aarey", "Goregaon East", "Jogeshwari East", "Mogra",
                "Gundavali",
            ], "city_map": {},
        },
        "Line 3 (Aqua)": {
            "endpoints": [(18.9430, 72.8340), (19.1400, 72.8290)],
            "opening_year": 2024, "default_city": "Mumbai",
            "stations": [
                "Cuffe Parade", "Vidhan Bhavan", "Churchgate", "Hutatma Chowk",
                "CSMT Metro", "Kalbadevi", "Girgaon", "Grant Road",
                "Mumbai Central Metro", "Mahalaxmi", "Science Museum", "Acharya Atre Chowk",
                "Worli", "Siddhivinayak", "Dadar", "Shitladevi", "Dharavi",
                "BKC", "Vidyanagari", "Santacruz Metro", "CSIA Domestic Airport",
                "Sahar Road", "CSIA International Airport", "Marol Naka",
                "MIDC", "SEEPZ", "Aarey JVLR",
            ],
            "city_map": {},
        },
    },
}

# ============================== PUNE METRO =================================
METROS["Pune Metro"] = {
    "state": "Maharashtra",
    "lines": {
        "Purple Line": {
            "endpoints": [(18.6560, 73.7600), (18.4470, 73.8580)],
            "opening_year": 2022, "default_city": "Pune",
            "stations": [
                "PCMC", "Sant Tukaram Nagar", "Bhosari", "Kasarwadi", "Phugewadi",
                "Dapodi", "Bopodi", "Khadki", "Range Hills", "Shivaji Nagar",
                "Civil Court", "Budhwar Peth", "Mandai", "Swargate",
            ], "city_map": {},
        },
        "Aqua Line": {
            "endpoints": [(18.5620, 73.7770), (18.5170, 73.9430)],
            "opening_year": 2022, "default_city": "Pune",
            "stations": [
                "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop", "Garware College",
                "Deccan Gymkhana", "Chhatrapati Sambhaji Udyan", "PMC", "Civil Court",
                "Mangalwar Peth", "Pune Railway Station", "Ruby Hall Clinic",
                "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi",
            ], "city_map": {},
        },
    },
}

# ============================= NAGPUR METRO ================================
METROS["Nagpur Metro"] = {
    "state": "Maharashtra",
    "lines": {
        "Orange Line": {
            "endpoints": [(21.2180, 79.0510), (21.0710, 79.0640)],
            "opening_year": 2019, "default_city": "Nagpur",
            "stations": [
                "Automotive Square", "Nari Road", "Indora Square", "Kadbi Chowk",
                "Gaddigodam", "Kasturchand Park", "Zero Mile", "Sitabuldi",
                "Congress Nagar", "Rahate Colony", "Ajni Square", "Chhatrapati Square",
                "Jaiprakash Nagar", "Ujjwal Nagar", "Airport", "Airport South",
                "New Airport", "Khapri",
            ], "city_map": {},
        },
        "Aqua Line": {
            "endpoints": [(21.1490, 78.9930), (21.1560, 79.1210)],
            "opening_year": 2019, "default_city": "Nagpur",
            "stations": [
                "Lokmanya Nagar", "Subhash Nagar", "Rachana Ring Road", "Vasudev Nagar",
                "Bansi Nagar", "Dharampeth College", "Shankar Nagar Square",
                "LAD Square", "Dharampeth", "Sitabuldi", "Jhansi Rani Square",
                "Institution of Engineers", "Cotton Market", "Nagpur Railway Station",
                "Dosar Vaishya Square", "Agrasen Square", "Chitaroli Square",
                "Prajapati Nagar",
            ], "city_map": {},
        },
    },
}

# =========================== BENGALURU METRO ===============================
METROS["Bengaluru Metro"] = {
    "state": "Karnataka",
    "lines": {
        "Purple Line": {
            "endpoints": [(12.9660, 77.4560), (12.9950, 77.7580)],
            "opening_year": 2016, "default_city": "Bengaluru",
            "stations": [
                "Challaghatta", "Kengeri", "Kengeri Bus Terminal", "Pattanagere",
                "Jnanabharathi", "Rajarajeshwari Nagar", "Nayandahalli", "Mysuru Road",
                "Deepanjali Nagar", "Attiguppe", "Vijayanagar", "Hosahalli",
                "Magadi Road", "City Railway Station", "Majestic", "Sir M. Visvesvaraya",
                "Vidhana Soudha", "Cubbon Park", "MG Road", "Trinity", "Halasuru",
                "Indiranagar", "Swami Vivekananda Road", "Baiyappanahalli",
                "Benniganahalli", "KR Puram", "Mahadevapura", "Garudacharpalya",
                "Hoodi", "Seetharamapalya", "Kundalahalli", "Nallurhalli",
                "Sri Sathya Sai Hospital", "Pattandur Agrahara", "Kadugodi Tree Park",
                "Channasandra", "Whitefield (Kadugodi)",
            ], "city_map": {},
        },
        "Green Line": {
            "endpoints": [(13.0560, 77.5000), (12.8930, 77.5940)],
            "opening_year": 2014, "default_city": "Bengaluru",
            "stations": [
                "Madavara", "Chikkabidarakallu", "Manjunathanagar", "Nagasandra",
                "Dasarahalli", "Jalahalli", "Peenya Industry", "Peenya",
                "Goraguntepalya", "Yeshwanthpur", "Sandal Soap Factory", "Mahalakshmi",
                "Rajajinagar", "Mahakavi Kuvempu Road", "Srirampura",
                "Mantri Square Sampige Road", "Majestic", "Chickpete", "KR Market",
                "National College", "Lalbagh", "South End Circle", "Jayanagar",
                "RV Road", "Banashankari", "JP Nagar", "Yelachenahalli",
                "Konanakunte Cross", "Doddakallasandra", "Vajarahalli",
                "Thalaghattapura", "Silk Institute",
            ], "city_map": {},
        },
    },
}

# =========================== HYDERABAD METRO ===============================
METROS["Hyderabad Metro"] = {
    "state": "Telangana",
    "lines": {
        "Red Line": {
            "endpoints": [(17.5040, 78.4110), (17.3210, 78.5480)],
            "opening_year": 2017, "default_city": "Hyderabad",
            "stations": [
                "Miyapur", "JNTU College", "KPHB Colony", "Kukatpally",
                "Balanagar", "Moosapet", "Bharat Nagar", "Erragadda", "ESI Hospital",
                "SR Nagar", "Ameerpet", "Punjagutta", "Irrum Manzil", "Khairatabad",
                "Lakdikapul", "Assembly", "Nampally", "Gandhi Bhavan", "Osmania Medical College",
                "MG Bus Station", "Malakpet", "New Market", "Musarambagh",
                "Dilsukhnagar", "Chaitanyapuri", "Victoria Memorial", "LB Nagar",
            ], "city_map": {},
        },
        "Blue Line": {
            "endpoints": [(17.4360, 78.3480), (17.4050, 78.5560)],
            "opening_year": 2017, "default_city": "Hyderabad",
            "stations": [
                "Raidurg", "HITEC City", "Durgam Cheruvu", "Madhapur", "Peddamma Gudi",
                "Jubilee Hills Check Post", "Jubilee Hills Road No 5", "Yusufguda",
                "Madhura Nagar", "Ameerpet", "Begumpet", "Prakash Nagar", "Rasoolpura",
                "Paradise", "Parade Ground", "Secunderabad East", "Mettuguda",
                "Tarnaka", "Habsiguda", "NGRI", "Stadium", "Uppal",
                "Nagole",
            ], "city_map": {},
        },
        "Green Line": {
            "endpoints": [(17.4400, 78.4980), (17.3740, 78.4870)],
            "opening_year": 2020, "default_city": "Hyderabad",
            "stations": [
                "JBS Parade Ground", "Secunderabad West", "Gandhi Hospital",
                "Musheerabad", "RTC Cross Roads", "Chikkadpally", "Narayanaguda",
                "Sultan Bazaar", "MG Bus Station",
            ], "city_map": {},
        },
    },
}

# ============================ CHENNAI METRO ================================
METROS["Chennai Metro"] = {
    "state": "Tamil Nadu",
    "lines": {
        "Blue Line": {
            "endpoints": [(13.0030, 80.1710), (13.0820, 80.2900)],
            "opening_year": 2015, "default_city": "Chennai",
            "stations": [
                "Chennai Airport", "Meenambakkam", "Nanganallur Road",
                "Arignar Anna Alandur", "St. Thomas Mount", "Little Mount",
                "Guindy", "Nandanam", "Saidapet", "Little Mount Metro",
                "Teynampet", "AG-DMS", "Thousand Lights", "LIC", "Government Estate",
                "Chennai Central Metro", "High Court", "Mannadi",
                "Washermanpet", "Theagaraya College", "Tondiarpet", "Wimco Nagar",
                "Wimco Nagar Depot",
            ], "city_map": {},
        },
        "Green Line": {
            "endpoints": [(13.0820, 80.2780), (12.9490, 80.1420)],
            "opening_year": 2016, "default_city": "Chennai",
            "stations": [
                "Chennai Central Metro", "Egmore", "Nehru Park", "Kilpauk",
                "Pachaiyappa's College", "Shenoy Nagar", "Anna Nagar East",
                "Anna Nagar Tower", "Thirumangalam", "Koyambedu", "CMBT",
                "Arumbakkam", "Vadapalani", "Ashok Nagar", "Ekkattuthangal",
                "Arignar Anna Alandur", "St. Thomas Mount",
            ], "city_map": {},
        },
    },
}

# ============================ KOLKATA METRO ================================
METROS["Kolkata Metro"] = {
    "state": "West Bengal",
    "lines": {
        "Blue Line": {
            "endpoints": [(22.6180, 88.4030), (22.4620, 88.3960)],
            "opening_year": 1984, "default_city": "Kolkata",
            "stations": [
                "Dakshineswar", "Baranagar", "Noapara", "Dum Dum", "Belgachia",
                "Shyambazar", "Shovabazar Sutanuti", "Girish Park", "Mahatma Gandhi Road",
                "Central", "Chandni Chowk", "Esplanade", "Park Street", "Maidan",
                "Rabindra Sadan", "Netaji Bhavan", "Jatin Das Park", "Kalighat",
                "Rabindra Sarobar", "Mahanayak Uttam Kumar", "Netaji", "Masterda Surya Sen",
                "Gitanjali", "Kavi Nazrul", "Shahid Khudiram", "Kavi Subhash",
            ], "city_map": {},
        },
        "Green Line": {
            "endpoints": [(22.5680, 88.4360), (22.5560, 88.3420)],
            "opening_year": 2020, "default_city": "Kolkata",
            "stations": [
                "Salt Lake Sector V", "Karunamoyee", "Central Park", "City Centre",
                "Bengal Chemical", "Salt Lake Stadium", "Phoolbagan", "Sealdah",
                "Esplanade", "Mahakaran", "Howrah", "Howrah Maidan",
            ], "city_map": {"Howrah": "Howrah", "Howrah Maidan": "Howrah"},
        },
    },
}

# =========================== AHMEDABAD METRO ===============================
METROS["Ahmedabad Metro"] = {
    "state": "Gujarat",
    "lines": {
        "Blue Line": {
            "endpoints": [(23.0290, 72.5470), (22.9930, 72.6640)],
            "opening_year": 2019, "default_city": "Ahmedabad",
            "stations": [
                "APMC", "Jivraj Park", "Rajivnagar", "Shreyas", "Paldi",
                "Gandhigram", "Old High Court", "Shahpur", "Gheekanta",
                "Kalupur Railway Station", "Kankaria East", "Apparel Park",
                "Amraiwadi", "Rabari Colony", "Vastral", "Nirant Cross Road",
                "Vastral Gam",
            ], "city_map": {},
        },
        "Red Line": {
            "endpoints": [(23.1210, 72.5860), (22.9880, 72.5720)],
            "opening_year": 2019, "default_city": "Ahmedabad",
            "stations": [
                "Motera Stadium", "Sabarmati", "AEC", "Sabarmati Railway Station",
                "Ranip", "Vadaj", "Vijaynagar", "Usmanpura", "Old High Court",
                "Gandhigram", "Jivrajpark", "Rajivnagar", "SP Stadium",
                "Shahpur Extended", "Gujarat University", "Gurukul Road",
                "Doordarshan Kendra", "Thaltej Gam", "Thaltej",
            ], "city_map": {},
        },
    },
}

# ============================== KOCHI METRO ================================
METROS["Kochi Metro"] = {
    "state": "Kerala",
    "lines": {
        "Line 1 (Blue)": {
            "endpoints": [(10.0620, 76.3160), (9.9700, 76.3070)],
            "opening_year": 2017, "default_city": "Kochi",
            "stations": [
                "Aluva", "Pulinchodu", "Companypady", "Ambattukavu", "Muttom",
                "Kalamassery", "Cochin University", "Pathadipalam", "Edapally",
                "Changampuzha Park", "Palarivattom", "JLN Stadium", "Kaloor",
                "Town Hall", "MG Road", "Maharaja's College", "Ernakulam South",
                "Kadavanthra", "Elamkulam", "Vyttila", "Thaikoodam", "Petta",
                "Vadakkekotta", "SN Junction", "Thrippunithura",
            ], "city_map": {},
        },
    },
}

# ============================= LUCKNOW METRO ===============================
METROS["Lucknow Metro"] = {
    "state": "Uttar Pradesh",
    "lines": {
        "Red Line": {
            "endpoints": [(26.7620, 80.8850), (26.7590, 81.0000)],
            "opening_year": 2017, "default_city": "Lucknow",
            "stations": [
                "CCS Airport", "Amausi", "Transport Nagar", "Krishna Nagar",
                "Singar Nagar", "Alambagh Bus Station", "Alambagh", "Mawaiya",
                "Durgapuri", "Charbagh", "Hussainganj", "Sachivalaya",
                "Hazratganj", "KD Singh Babu Stadium", "Vishwavidyalaya",
                "IT College", "Badshahnagar", "Lekhraj Market", "Bhootnath Market",
                "Indira Nagar", "Munshipulia",
            ], "city_map": {},
        },
    },
}

# ============================== JAIPUR METRO ===============================
METROS["Jaipur Metro"] = {
    "state": "Rajasthan",
    "lines": {
        "Pink Line": {
            "endpoints": [(26.9330, 75.7250), (26.9200, 75.8300)],
            "opening_year": 2015, "default_city": "Jaipur",
            "stations": [
                "Mansarovar", "New Aatish Market", "Vivek Vihar", "Shyam Nagar",
                "Ram Nagar", "Civil Lines", "Railway Station", "Sindhi Camp",
                "Chandpole", "Choti Chaupar", "Badi Chaupar", "Transport Nagar",
            ], "city_map": {},
        },
    },
}

# ============================== KANPUR METRO ===============================
METROS["Kanpur Metro"] = {
    "state": "Uttar Pradesh",
    "lines": {
        "Orange Line": {
            "endpoints": [(26.5150, 80.2320), (26.4390, 80.3490)],
            "opening_year": 2021, "default_city": "Kanpur",
            "stations": [
                "IIT Kanpur", "Kalyanpur", "SPM Hospital", "Vishwavidyalaya",
                "Gurudev Chauraha", "Geeta Nagar", "Rawatpur", "LLR Hospital",
                "Motijheel", "Chunniganj", "Naveen Market", "Bada Chauraha",
                "Nayaganj", "Kanpur Central", "Jhakarkati", "Transport Nagar",
                "Baradevi", "Kidwai Nagar", "Basant Vihar", "Vijay Nagar",
                "Naubasta",
            ], "city_map": {},
        },
    },
}

# ============================== AGRA METRO ================================
METROS["Agra Metro"] = {
    "state": "Uttar Pradesh",
    "lines": {
        "Yellow Line": {
            "endpoints": [(27.1690, 78.0100), (27.1770, 78.0300)],
            "opening_year": 2024, "default_city": "Agra",
            "stations": [
                "Taj East Gate", "Basai", "Fatehabad Road", "Taj Mahal",
                "Agra Fort", "Mankameshwar", "SN Medical College", "Agra College",
                "Raja Ki Mandi", "RBS College", "Jama Masjid",
            ], "city_map": {},
        },
    },
}

# ============================= BHOPAL METRO ================================
METROS["Bhopal Metro"] = {
    "state": "Madhya Pradesh",
    "lines": {
        "Orange Line": {
            "endpoints": [(23.2900, 77.4000), (23.2000, 77.4600)],
            "opening_year": 2024, "default_city": "Bhopal",
            "stations": [
                "Karond Circle", "DIG Bungalow", "Krishi Upaj Mandi",
                "Pul Bogda", "Bharat Talkies", "Nadra Bus Stand", "Aish Bagh",
                "Subhash Nagar", "MP Nagar", "Alkapuri", "Rani Kamlapati Station",
                "DB City", "Board Office", "Habibganj Naka", "AIIMS Bhopal",
            ], "city_map": {},
        },
    },
}

# ============================= INDORE METRO ================================
METROS["Indore Metro"] = {
    "state": "Madhya Pradesh",
    "lines": {
        "Yellow Line": {
            "endpoints": [(22.7530, 75.8940), (22.6800, 75.8300)],
            "opening_year": 2024, "default_city": "Indore",
            "stations": [
                "Gandhi Nagar", "Super Corridor 6", "Super Corridor 3",
                "Bhawrasla", "MR-10", "ISBT", "Radisson Square", "Vijay Nagar",
                "Bengali Square", "Palasia", "Rajwada", "Airport",
                "Robot Square", "Mumtaj Bagh", "Bada Ganpati",
            ], "city_map": {},
        },
    },
}
