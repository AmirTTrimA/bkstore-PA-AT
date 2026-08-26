// ✅
import React,{useState,useEffect,useRef,useCallback,useMemo} from 'react'
import {Box,Button,TextField,Grid,Autocomplete} from '@mui/material';
import iranData from "../../../../iranData.json";
// style in Profile.css



// ============================================
// Constants
// ============================================
const PHONE_REGEX = /^09\d{9}$/;   // start 09 and must have 9 more num
const POSTCODE_REGEX = /^\d{10}$/;
const MIN_NAME_LENGTH = 3;
const MIN_ADDRESS_LENGTH = 2;


// ============================================
//    Main 
// ============================================
export default function Manually({notificationRef, onSave, editingAddress, isEditing}) {

  //---Ref---
  const isLoadingEdit = useRef(false)

  //---State---
  const[useradd,setUserAdd]=useState({

    province:"",
    city:"",
    address:"",
    

    receivername:"",
    phone:"",
    
    platenum:"",
    postcode:"",

    
   

  })

  const [errors, setErrors] = useState({

    province:"",
    city:"",
    address: "",


    receivername:"",
    phone:"",
    
    platenum:"",
    postcode: "",

  });


  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);


  // ---Memoized Values---
  const isFormValid = useMemo(() => {
    return (
      useradd.province?.trim() &&
      useradd.city?.trim() &&
      useradd.receivername?.trim().length >= MIN_NAME_LENGTH &&
      useradd.address?.trim() &&
      useradd.phone?.trim() &&
      useradd.platenum?.trim() &&
      useradd.postcode?.trim()
    );
  }, [useradd]);



//---Effects---

// Load provience
useEffect(() => {
  setProvinces(iranData.provinces);
}, []);


// Load editing address
  useEffect(() => {
    if (editingAddress && isEditing) {
      isLoadingEdit.current = true;

      // Set form data
      setUserAdd({
        province: editingAddress.province || "",
        city: editingAddress.city || "",
        address: editingAddress.address || "",
        receivername: editingAddress.receivername || "",
        phone: editingAddress.phone || "",
        platenum: editingAddress.platenum || "",
        postcode: editingAddress.postcode || "",
      });




      // Set province Autocomplete
      const foundProvince = provinces.find(p => p.name === editingAddress.province);
      if (foundProvince) {
        setSelectedProvince(foundProvince);
        
        // Set city for province 
        const provinceCities = iranData.cities[foundProvince.id] || [];
        const formattedCities  = provinceCities.map(cityName=>({
          id: `${foundProvince.id}-${cityName}`,
          name:cityName
        }));

        setCities(formattedCities);
        
        // Set city for AutoComplete
        const foundCity = formattedCities.find(c => c.name === editingAddress.city);
        if (foundCity) {
          setSelectedCity(foundCity)
        }
      }
      setTimeout(() => {
        isLoadingEdit.current = false;
      }, 100);
    }else{

      setUserAdd({
        province: "",
        city: "",
        address: "",
        receivername: "",
        phone: "",
        platenum: "",
        postcode: "",
      });
      setSelectedProvince(null);
      setSelectedCity(null);
      setCities([]);


    }
  }, [editingAddress, isEditing, provinces]);




  
 // Handle province selection
  useEffect(() => {
    if (selectedProvince) {
      const provinceCities = iranData.cities[selectedProvince.id] || [];
      setCities(provinceCities.map(cityName => ({ 
        id: `${selectedProvince.id}-${cityName}`, 
        name: cityName 
      })));

      setUserAdd(prev=>({
        ...prev,
        province: selectedProvince.name
      }));

      if(!isLoadingEdit.current){
          setSelectedCity(null);
          setUserAdd(prev => ({
            ...prev,
            city: ''
          }));
      }

    } else {
      setCities([]);
      if(!isLoadingEdit.current){
      setSelectedCity(null);
      setUserAdd(prev=>({...prev,city:''}));

      }
  }
    
  }, [selectedProvince]);


// Handle city selection
  useEffect(() => {
    if (selectedCity) {
      setUserAdd(prev => ({ 
        ...prev, 
        city: selectedCity.name 
      }));


      setErrors(prev=>{
        if(prev.city){
          return { ...prev, city:''}
        }
        return prev;
      })
      


    } else {
      setUserAdd(prev => ({ 
        ...prev, 
        city: "" 
      }));
    }
  }, [selectedCity]);


  //---Validtions---

  const Validations = useCallback(()=> {

          let isValid = true;
          const newErrors = {
              province:'',
              city:'',
              address:'',
              receivername:'',
              phone:'',
              platenum:'',
              postcode:'',
    
          };
    
    
    
          // Province validations
          if (!useradd.province || useradd.province.trim() === '') {
            newErrors.province = 'province is required';
            isValid = false;
          }
    
          // City validations
          if (!useradd.city || useradd.city.trim() === '') {
            newErrors.city = 'city is required';
            isValid = false;
          }

          // Receiver name validation
          if(!useradd.receivername || useradd.receivername.trim() === ''){
            newErrors.receivername = 'receivername required';
            isValid=false;
          }else if(useradd.receivername.trim().length < 3){
            newErrors.receivername = 'receivername must be at least 3 character';
            isValid=false;
          }
    
    
    
          // Address validation
          if (!useradd.address || useradd.address.trim() === '') {
            
            newErrors.address = 'Address is required';
            isValid = false;
          } else {

              const parts = useradd.address.split(',').map(part=>part.trim()).filter(part=> part !== '');
             
              if(parts.length === 0){
                newErrors.address = 'Address is required';
                isValid = false;
              }else{

              const invalidParts = parts.some(part => part.length < MIN_ADDRESS_LENGTH);
              if (invalidParts) {
                newErrors.address = `Each address part must be at least ${MIN_ADDRESS_LENGTH} characters`;
                isValid = false;
              }
            }
          }
    
    
    
            // Platenum validation
            if(!useradd.platenum || useradd.platenum.trim() === ''){
              newErrors.platenum = 'platenum required';
              isValid = false;
            }else if(useradd.platenum <=0){
              newErrors.platenum = 'platenum cant be 0 or less ';
              isValid = false;
            }
    
    
    
            
            // Postcode validation
            if(!useradd.postcode || useradd.postcode.trim() === ''){
              newErrors.postcode = 'post-code required';
              isValid = false;
            }else if(!POSTCODE_REGEX.test(useradd.postcode)){
              newErrors.postcode = 'post-code is 10 number ';
              isValid = false;
            }
    
    
            // Phone validation
            if(!useradd.phone || useradd.phone.trim() === ''){
              newErrors.phone = 'phone required';
              isValid = false;
            } else if(!PHONE_REGEX.test(useradd.phone) ){
              newErrors.phone = 'phone contain 11 digits (start with 09)';
              isValid = false;
            }
    
            setErrors(newErrors);
            return isValid;
    
  },[useradd])
    


    //---Handlers---
    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setUserAdd(prev=>({ ...prev , [name]:value}));

      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    },[errors])

  
    const handleSubmit = useCallback((e) => {
      e.preventDefault();

       // Validate before save
       if (!Validations()) {
        notificationRef.current.showNotif('Please fix the errors','error')

        return;
      }



      const cleanData = {

        province:useradd.province.trim(),
        city:useradd.city.trim(),
        platenum:useradd.platenum.toString().trim(),
        receivername: useradd.receivername.trim(),
        address:useradd.address.trim(),
        postcode: useradd.postcode.toString().trim(),
        phone: useradd.phone.trim(),
      };

      
      onSave(cleanData);

    },[useradd,Validations,notificationRef,onSave])



    const getValue = (value) => {
      return value || "";
    };









  return (
    <Box>
    <Grid container spacing={2} sx={{mt:2}}>
        <Grid size={12} >
          {/* Province */}
            <Autocomplete
              options={provinces}
              getOptionLabel={(option) => option?.name || ""}
              sx={{mb:2}}
              value={selectedProvince}
              onChange={(event, newValue) => setSelectedProvince(newValue)}
              renderInput={(params) =>(
                  <TextField 
                    {...params}
                    label="province" 
                    error={!!errors.province}
                    helperText={errors.province}
                  />
                )}
            />
            {/* City */}
            <Autocomplete
              options={cities}
              getOptionLabel={(option) => option?.name || ''}
              sx={{mb:2}}
              value={selectedCity}
              onChange={(event, newValue) => setSelectedCity(newValue)}
              disabled={!selectedProvince}
              renderInput={(params) =>(
                  <TextField 
                    {...params}
                    label="city"
                    error={!!errors.city}
                    helperText={errors.city}
                    disabled={!selectedProvince}
                    />)}
            />



            {/* Reciver Name */}
            <TextField
              fullWidth
              label="receivername"
              name="receivername"
              className="customTextField"
              value={getValue(useradd.receivername)}
              onChange={handleChange}
              error={!!errors.receivername}
              helperText={errors.receivername}
              sx={{ mb: 2,}}
              required
            />

            {/* Phone */}
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              className="customTextField"
              value={getValue(useradd.phone)}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{mb: 2}}
              required
            />

            {/* Address */}
            <TextField
              fullWidth
              label="Address (separate by comma)"
              name="address"
              className="customTextField"
              value={getValue(useradd.address)}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              multiline
              rows={3}
              sx={{
                 mb: 2,
                 '& .MuiInputBase-root': {
                  height: '100px', 
                }
                }}
              required
            />

          {/* Plate Number & Postcode */}
          <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="platenum"
                        name="platenum"
                        className="customTextField"
                        value={getValue(useradd.platenum) }
                        error={!!errors.platenum}
                        helperText={errors.platenum}
                        onChange={handleChange}
                        sx={{mb:2}}
                        required
                       />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="postcode"
                        name="postcode"
                        className="customTextField"
                        value={getValue(useradd.postcode) }
                        error={!!errors.postcode}
                        helperText={errors.postcode}
                        onChange={handleChange}
                        sx={{mb:2}}
                        required
                      />
              </Grid>
          </Grid>
      </Grid>
  </Grid>


        <Button 
          type="submit"
          onClick={handleSubmit}
          variant="contained" 
          className='save-btn'
          disabled={!isFormValid}
          sx={{
            p:1.5,
            mt:1,
           backgroundColor:'red'
           }} 
        >
          {isEditing ? 'Update ' : 'Save '}
        </Button>

</Box>
  )
}
