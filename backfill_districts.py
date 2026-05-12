from database import db

# The district map from script.js
tamilNaduDistricts = {
    'Ariyalur': ['Ariyalur','Jayankondam','Sendurai','Udayarpalayam','Andimadam','T.Palur'],
    'Chengalpattu': ['Chengalpattu','Tambaram','Mahabalipuram','Vandalur','Guduvancheri','Kelambakkam','Padappai','Thiruporur','Pallavaram','Chrompet'],
    'Chennai': ['T Nagar','Anna Nagar','Adyar','Mylapore','Velachery','Porur','Guindy','Nungambakkam','Egmore','Tambaram','Chromepet','Kodambakkam','Vadapalani','Ashok Nagar','Thiruvanmiyur','Besant Nagar','Royapettah','Triplicane','Perambur','Tondiarpet','Sowcarpet','Kilpauk','Chetpet','Saidapet','Medavakkam'],
    'Coimbatore': ['Gandhipuram','RS Puram','Saibaba Colony','Peelamedu','Singanallur','Ukkadam','Town Hall','Sulur','Pollachi','Mettupalayam','Valparai','Kinathukadavu','Annur'],
    'Cuddalore': ['Cuddalore','Chidambaram','Virudhachalam','Panruti','Kattumannarkoil','Kurinjipadi','Bhuvanagiri'],
    'Dharmapuri': ['Dharmapuri','Palacode','Pennagaram','Harur','Nallampalli','Karimangalam'],
    'Dindigul': ['Dindigul','Palani','Oddanchatram','Natham','Kodaikanal','Vedasandur','Nilakottai','Batlagundu'],
    'Erode': ['Erode','Bhavani','Gobichettipalayam','Sathyamangalam','Perundurai','Anthiyur','Nambiyur'],
    'Kallakurichi': ['Kallakurichi','Ulundurpet','Sankarapuram','Chinnasalem','Tirukoilur','Rishivandiyam'],
    'Kancheepuram': ['Kancheepuram','Sriperumbudur','Uthiramerur','Walajabad','Kundrathur'],
    'Kanniyakumari': ['Nagercoil','Kanyakumari','Marthandam','Colachel','Padmanabhapuram','Thuckalay','Kuzhithurai'],
    'Karur': ['Karur','Kulithalai','Aravakurichi','Krishnarayapuram','Pugalur','Thanthoni'],
    'Krishnagiri': ['Krishnagiri','Hosur','Denkanikottai','Pochampalli','Uthangarai','Bargur','Shoolagiri'],
    'Madurai': ['Madurai North','Madurai South','Thiruparankundram','Melur','Vadipatti','Usilampatti','Peraiyur','Thirumangalam','Sholavandan','Kallikudi'],
    'Mayiladuthurai': ['Mayiladuthurai','Sirkazhi','Kuthalam','Tharangambadi','Poompuhar','Sembanarkoil'],
    'Nagapattinam': ['Nagapattinam','Thirukkuvalai','Kilvelur','Vedaranyam','Kollidam'],
    'Namakkal': ['Namakkal','Rasipuram','Tiruchengode','Paramathi Velur','Komarapalayam','Mohanur','Sendamangalam'],
    'Nilgiris': ['Ooty','Coonoor','Kotagiri','Gudalur','Kundah','Pandalur'],
    'Perambalur': ['Perambalur','Kunnam','Veppanthattai','Alathur'],
    'Pudukkottai': ['Pudukkottai','Aranthangi','Illuppur','Alangudi','Karambakudi','Thirumayam','Avudaiyarkoil'],
    'Ramanathapuram': ['Ramanathapuram','Rameswaram','Paramakudi','Mudukulathur','Kamuthi','Kadaladi','Thiruvadanai'],
    'Ranipet': ['Ranipet','Arakkonam','Walajah','Arcot','Sholinghur','Nemili','Timiri'],
    'Salem': ['Salem Town','Attur','Mettur','Omalur','Edappadi','Sankari','Yercaud','Gangavalli','Valapadi'],
    'Sivaganga': ['Sivaganga','Karaikudi','Devakottai','Manamadurai','Ilayangudi','Tirupathur','Kallal'],
    'Tenkasi': ['Tenkasi','Sankarankoil','Kadayanallur','Shenkottai','Courtallam','Alangulam','Vasudevanallur'],
    'Thanjavur': ['Thanjavur','Kumbakonam','Pattukkottai','Peravurani','Orathanadu','Thiruvidaimarudur','Thiruvaiyaru','Papanasam','Swarnapuri'],
    'Theni': ['Theni','Bodinayakanur','Periyakulam','Andipatti','Uthamapalayam','Cumbum'],
    'Thoothukudi': ['Thoothukudi','Kovilpatti','Tiruchendur','Kayathar','Vilathikulam','Ottapidaram','Srivaikundam','Eral'],
    'Tiruchirappalli': ['Trichy Town','Srirangam','Lalgudi','Musiri','Manachanallur','Thuraiyur','Manapparai','Thottiyam'],
    'Tirunelveli': ['Tirunelveli Town','Palayamkottai','Ambasamudram','Cheranmahadevi','Radhapuram','Nanguneri','Kalakkad','Pettai'],
    'Tirupattur': ['Tirupattur','Vaniyambadi','Ambur','Natrampalli','Jolarpet','Kandili'],
    'Tiruvallur': ['Tiruvallur','Avadi','Poonamallee','Ambattur','Thiruvottiyur','Gummidipoondi','Ponneri','Red Hills','Madhavaram'],
    'Tiruvannamalai': ['Tiruvannamalai','Polur','Arani','Cheyyar','Vandavasi','Chengam','Kilpennathur','Kalasapakkam'],
    'Tiruvarur': ['Tiruvarur','Mannargudi','Nannilam','Thiruthuraipoondi','Needamangalam','Valangaiman','Kodavasal'],
    'Vellore': ['Vellore Town','Katpadi','Gudiyatham','Pernambut','Anaicut','KV Kuppam','Kaniyambadi'],
    'Viluppuram': ['Viluppuram','Tindivanam','Gingee','Kallakurichi','Ulundurpettai','Thiruvennainallur','Vanur','Marakkanam'],
    'Virudhunagar': ['Virudhunagar','Sivakasi','Srivilliputhur','Rajapalayam','Aruppukkottai','Sattur','Tiruchuli','Watrap'],
    'Tiruppur': ['Tiruppur Town','Avinashi','Palladam','Dharapuram','Kangayam','Udumalaipettai','Vellakoil','Madathukulam']
}

def backfill():
    print("Backfilling district column for existing stalls...")
    stalls = db.get_all_stalls()
    updated_count = 0

    for stall in stalls:
        if stall.get('district'):
            continue
        
        area = stall.get('area')
        found_district = None
        
        for district, areas in tamilNaduDistricts.items():
            if area in areas:
                found_district = district
                break
        
        if found_district:
            print(f"  Stall {stall['id']} ({stall['name']}): Area '{area}' -> District '{found_district}'")
            with db._cursor() as cursor:
                cursor.execute(
                    'UPDATE stalls SET district = %s WHERE id = %s' if db.is_postgresql else 'UPDATE stalls SET district = ? WHERE id = ?',
                    (found_district, stall['id'])
                )
            updated_count += 1
        else:
            print(f"  Stall {stall['id']} ({stall['name']}): Could not find district for area '{area}'")

    print(f"Done! Updated {updated_count} stalls.")

if __name__ == "__main__":
    backfill()
