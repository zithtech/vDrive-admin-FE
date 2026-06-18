import { AutoComplete, Button, Card, Divider, Input, InputNumber, Modal, Space } from "antd";
import { messageApi as message } from "../../utilities/antdStaticHolder";
import { MdOutlineLocationOn } from "react-icons/md";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { debounce, startCase } from "lodash";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createArea,
  fetchAreas,
  fetchCities,
  fetchCountries,
  fetchState,
  fetchAreaById,
  fetchDistrictById,
} from "../../store/slices/locationSlice";

interface LocationConfigurationProps {
  country: string;
  setCountry: (country: string) => void;
  state: string;
  setState: (state: string) => void;
  district: string;
  setDistrict: (district: string) => void;
  area: string;
  setArea: (area: string) => void;
  pincode: string;
  setPincode: (pincode: string) => void;
  globalPrice: number;
  setGlobalPrice: (globalPrice: number) => void;
}

const LocationConfiguration = ({
  country,
  setCountry,
  state,
  setState,
  district,
  setDistrict,
  area,
  setArea,
  pincode,
  setPincode,
  globalPrice,
  setGlobalPrice,
}: LocationConfigurationProps) => {
  const dispatch = useAppDispatch();
  const {
    countries,
    isLoadingCountries,
    states,
    isLoadingStates,
    districts,
    isLoadingCities,
    areas,
    isLoadingAreas,
  } = useAppSelector((state) => state.location);

  // One-time initialization refs to support "Defaults -> Editable" workflow
  const countryInitialized = useRef(false);
  const stateInitialized = useRef(false);
  const districtInitialized = useRef(false);

  const [areaSearchValue, setAreaSearchValue] = useState("");
  const [createAreaName, setCreateAreaName] = useState(""); // Snapshot for modal
  const [createZipcode, setCreateZipcode] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingArea, setIsCreatingArea] = useState(false);

  // States for AutoComplete input values (display names)
  // We need these because AutoComplete value is text, but we store IDs in props
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const debouncedCountrySearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(fetchCountries({ limit: 20, search: searchValue }));
    }, 500),
    [dispatch],
  );

  const debouncedStateSearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(fetchState({ countryId: country, search: searchValue, limit: 20 }));
    }, 500),
    [dispatch, country],
  );

  const debouncedCitySearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(
        fetchCities({
          stateId: state,
          search: searchValue,
          limit: 100,
        }),
      );
    }, 500),
    [dispatch, country, state],
  );

  const debouncedAreaSearch = useCallback(
    debounce((searchValue: string) => {
      dispatch(
        fetchAreas({
          countryId: country,
          stateId: state,
          districtId: district,
          search: searchValue,
          limit: 20,
        }),
      );
    }, 500),
    [dispatch, country, state, district],
  );

  const handleCountrySearch = (value: string) => {
    setCountrySearch(value);
    setCountry(""); // Clear ID on type
    debouncedCountrySearch(value);
  };
  const handleStateSearch = (value: string) => {
    setStateSearch(value);
    setState(""); // Clear ID on type
    debouncedStateSearch(value);
  };
  const handleCitySearch = (value: string) => {
    setDistrictSearch(value);
    setDistrict(""); // Clear ID on type
    debouncedCitySearch(value);
  };
  const handleAreaSearch = (value: string) => {
    setAreaSearchValue(value);
    setArea(""); // Clear ID on type
    debouncedAreaSearch(value);
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPincode(e.target.value);
  };

  const handleAreaSelect = (_value: string, option: any) => {
    setArea(option.key); // option.key stores the ID
    setAreaSearchValue(option.label); // Keep the selected name visible
    const selectedArea = areas.find((a) => a.id === option.key);
    if (selectedArea && selectedArea.pincode) {
      setPincode(selectedArea.pincode);
    }
  };

  const openCreateDialog = () => {
    setCreateAreaName(startCase(areaSearchValue)); // Snapshot current input capitalized
    setCreateZipcode("");
    setIsCreateModalOpen(true);
  };

  const submitCreateArea = async () => {
    if (!createAreaName || !createZipcode) return;

    setIsCreatingArea(true);
    try {
      const resultAction = await dispatch(
        createArea({
          place: createAreaName,
          country_id: country,
          state_id: state,
          district_id: district,
          zipcode: createZipcode,
        }),
      );

      if (createArea.fulfilled.match(resultAction)) {
        const newArea = resultAction.payload;

        // Close modal
        setIsCreateModalOpen(false);
        setCreateZipcode("");

        // Auto-select the newly created area
        setArea(newArea.id);
        setAreaSearchValue(newArea.place);

        // If the newly created area has a zipcode (which it should), prefill it in the main form too
        setPincode(newArea.zipcode);

        message.success("Area created successfully");
      } else {
        message.error("Failed to create area");
      }
    } catch (error) {
      console.error("Failed to create area", error);
      message.error("Failed to create area");
    } finally {
      setIsCreatingArea(false);
    }
  };

  const handleCreateZipcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers and hyphen only
    if (/^[0-9-]*$/.test(value)) {
      setCreateZipcode(value);
    }
  };

  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({
        label: `${c.flag} ${c.name}`,
        value: `${c.flag} ${c.name}`, // AutoComplete value is text
        key: c.id, // Store ID in key
      })),
    [countries],
  );
  const stateOptions = useMemo(
    () =>
      states.map((s) => ({
        label: s.name,
        value: s.name,
        key: s.id,
      })),
    [states],
  );
  const cityOptions = useMemo(
    () =>
      districts.map((c) => ({
        label: c.name,
        value: c.name,
        key: c.id,
      })),
    [districts],
  );
  const areaOptions = useMemo(
    () => areas.map((a) => ({ label: a.name, value: a.name, key: a.id })),
    [areas],
  );

  useEffect(() => {
    // Initial fetch searches for India to ensure it is available for auto-selection
    dispatch(fetchCountries({ limit: 100, search: "india" }));
  }, [dispatch]);

  useEffect(() => {
    if (country) {
      // If state is already set (edit mode), mark as initialized to skip search filter
      if (state) {
        stateInitialized.current = true;
      }

      // Search for Tamil Nadu only during initialization if country is India AND state not yet set
      let searchTerm = "";
      if (!stateInitialized.current && !state) {
        const selectedCountry = countries.find((c) => c.id === country);
        if (
          selectedCountry &&
          (selectedCountry.code === "IN" || selectedCountry.code.toLowerCase() === "india")
        ) {
          searchTerm = "tamil nadu";
        }
      }

      dispatch(fetchState({ countryId: country, search: searchTerm, limit: 100 }));
      // Sync display value
      const selected = countries.find((c) => c.id === country);
      if (selected) setCountrySearch(`${selected.flag} ${selected.name}`);
    }
  }, [country, dispatch, countries, state]);

  useEffect(() => {
    if (state && country) {
      const selectedState = states.find((s) => s.id === state);
      if (selectedState) setStateSearch(selectedState.name);

      // If district is already set (edit mode), mark as initialized to skip search filter
      if (district) {
        districtInitialized.current = true;
      }

      // Search for Chennai only during initialization if state is Tamil Nadu AND district not yet set
      let searchTerm = "";
      if (!districtInitialized.current && !district) {
        const selectedState = states.find((s) => s.id === state);
        if (selectedState && selectedState.name.toLowerCase() === "tamil nadu") {
          searchTerm = "chennai";
        }
      }

      dispatch(
        fetchCities({
          stateId: state,
          search: searchTerm,
          limit: 100,
        }),
      );
    }
  }, [state, country, dispatch, states, district]);

  // Proper solution: Fetch district by ID if we have one and ensure it's in the list
  useEffect(() => {
    if (district && state && country) {
      // Check if district is already in the list
      const selectedCity = districts.find((c) => c.id === district);

      if (!selectedCity) {
        // District not in list - fetch it by ID
        dispatch(fetchDistrictById(district))
          .unwrap()
          .then((fetchedDistrict: { name: string }) => {
            // Set display value once fetched
            setDistrictSearch(fetchedDistrict.name);
          })
          .catch(() => {
            // Handle error silently or show notification
          });
      } else {
        // District already in list - just sync display value
        setDistrictSearch(selectedCity.name);
      }

      // Fetch areas regardless
      dispatch(
        fetchAreas({
          countryId: country,
          stateId: state,
          districtId: district,
          limit: 20,
        }),
      );
    }
  }, [district, state, country, dispatch, districts]);

  // Sync Area display
  useEffect(() => {
    if (area) {
      const selected = areas.find((a) => a.id === area);
      if (selected) {
        setAreaSearchValue(selected.name);
        if (selected.pincode && (!pincode || pincode === "")) setPincode(selected.pincode);
      } else {
        dispatch(fetchAreaById(area))
          .unwrap()
          .then((data) => {
            const placeName = data.place || data.name || data.area_name;
            const zip = data.zipcode || data.pincode;

            if (placeName) setAreaSearchValue(placeName);

            if (zip && (!pincode || pincode === "")) {
              setPincode(zip);
            }
          })
          .catch((err) => console.error("Failed to fetch area details", err));
      }
    }
  }, [area, areas, dispatch]); // dependency on pincode removed to avoid loop

  // One-time Auto-select Logic for India
  // Only auto-select if country is empty (create mode)
  useEffect(() => {
    // If country already has a value, mark as initialized to skip auto-select
    if (country) {
      countryInitialized.current = true;
      return;
    }

    if (!countryInitialized.current && countries.length > 0 && !country && !isLoadingCountries) {
      const india = countries.find((c) => c.code === "IN" || c.code.toLowerCase() === "india");
      if (india) {
        setCountry(india.id);
        countryInitialized.current = true;
      }
    }
  }, [countries, country, setCountry, isLoadingCountries]);

  // One-time Auto-select Logic for Tamil Nadu
  // Only auto-select if state is empty (create mode)
  useEffect(() => {
    // If state already has a value, mark as initialized to skip auto-select
    if (state) {
      stateInitialized.current = true;
      return;
    }

    if (!stateInitialized.current && states.length > 0 && !state && country && !isLoadingStates) {
      // confirm country is India before forcing TN
      const selectedCountry = countries.find((c) => c.id === country);
      if (
        selectedCountry &&
        (selectedCountry.code === "IN" || selectedCountry.code.toLowerCase() === "india")
      ) {
        const tn = states.find((s) => s.name.toLowerCase() === "tamil nadu");
        if (tn) {
          setState(tn.id);
          stateInitialized.current = true;
        }
      }
    }
  }, [states, state, country, setState, countries, isLoadingStates]);

  // One-time Auto-select Logic for Chennai
  // Only auto-select if district is empty (create mode)
  useEffect(() => {
    // If district already has a value, mark as initialized to skip auto-select
    if (district) {
      districtInitialized.current = true;
      return;
    }

    if (
      !districtInitialized.current &&
      districts.length > 0 &&
      !district &&
      state &&
      !isLoadingCities
    ) {
      const chennai = districts.find((c) => c.name.toLowerCase().includes("chennai"));
      if (chennai) {
        setDistrict(chennai.id);
        districtInitialized.current = true;
      }
    }
  }, [districts, district, state, setDistrict, isLoadingCities]);

  useEffect(() => {
    return () => {
      debouncedCountrySearch.cancel();
      debouncedStateSearch.cancel();
      debouncedCitySearch.cancel();
      debouncedAreaSearch.cancel();
    };
  }, [debouncedCountrySearch, debouncedStateSearch, debouncedCitySearch, debouncedAreaSearch]);

  return (
    <Card className="w-full" size="small">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center gap-1">
            <div>
              <MdOutlineLocationOn className="text-[25px] text-[#0080FF]" />
            </div>
            <div>
              <span className="text-[20px] font-semibold p-0 m-0">Location Configuration</span>
            </div>
          </div>
          <div className=""></div>
        </div>
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">Country</span>
            <AutoComplete
              value={countrySearch}
              onSearch={handleCountrySearch}
              onSelect={(value, option) => {
                setCountry(option.key);
                setCountrySearch(value);
                setState("");
                setDistrict("");
                setArea("");
              }}
              onBlur={() => {
                if (!country) setCountrySearch("");
              }}
              options={countryOptions}
              placeholder="Search and select country"
              notFoundContent={isLoadingCountries ? "Loading..." : "No countries found"}
            />
          </div>
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">State</span>
            <AutoComplete
              value={stateSearch}
              onSearch={handleStateSearch}
              onSelect={(value, option) => {
                setState(option.key);
                setStateSearch(value);
                setDistrict("");
                setArea("");
              }}
              onBlur={() => {
                if (!state) setStateSearch("");
              }}
              options={stateOptions}
              placeholder="Search and select state"
              notFoundContent={isLoadingStates ? "Loading..." : "No states found"}
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">District</span>
            <AutoComplete
              value={districtSearch}
              onSearch={handleCitySearch}
              onSelect={(value, option) => {
                setDistrict(option.key);
                setDistrictSearch(value);
                setArea("");
              }}
              onBlur={() => {
                if (!district) setDistrictSearch("");
              }}
              options={cityOptions}
              placeholder="Search and select district"
              notFoundContent={isLoadingCities ? "Loading..." : "No districts found"}
            />
          </div>
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">Area</span>
            <AutoComplete
              value={areaSearchValue}
              allowClear
              onSearch={handleAreaSearch}
              onSelect={handleAreaSelect}
              onBlur={() => {
                if (!area) setAreaSearchValue("");
              }}
              options={areaOptions}
              placeholder="Search or create area"
              notFoundContent={isLoadingAreas ? "Loading..." : "No areas found"}
              popupRender={(menu) => (
                <>
                  {menu}
                  {areaSearchValue && !isLoadingAreas && areaOptions.length === 0 && (
                    <>
                      <Divider style={{ margin: "8px 0" }} />
                      <Space style={{ padding: "0 8px 4px" }}>
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={openCreateDialog}
                          block
                        >
                          Create "{areaSearchValue}"
                        </Button>
                      </Space>
                    </>
                  )}
                </>
              )}
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-2 gap-4">
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">Pincode</span>
            <Input value={pincode} onChange={handlePincodeChange} />
          </div>
          <div className="w-full flex flex-col">
            <span className="text-sm font-medium mb-1">Global Price</span>
            <InputNumber
              value={globalPrice}
              onChange={(e) => setGlobalPrice(e || 0)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <Modal
        title="Create New Area"
        open={isCreateModalOpen}
        onCancel={() => !isCreatingArea && setIsCreateModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            disabled={isCreatingArea}
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isCreatingArea}
            disabled={!createAreaName || !createZipcode}
            onClick={submitCreateArea}
          >
            Create
          </Button>,
        ]}
        maskClosable={false}
        keyboard={!isCreatingArea}
        closable={!isCreatingArea}
      >
        <Space direction="vertical" className="w-full gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Area Name</span>
            <Input value={createAreaName} onChange={(e) => setCreateAreaName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Pincode</span>
            <Input
              placeholder="Enter Pincode"
              value={createZipcode}
              onChange={handleCreateZipcodeChange}
              maxLength={10}
            />
            <span className="text-xs text-gray-500">Only numbers and hyphens are allowed.</span>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default LocationConfiguration;
